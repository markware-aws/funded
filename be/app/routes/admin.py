from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from boto3.dynamodb.conditions import Key
from pydantic import BaseModel

from app.db import get_table
from app.auth import require_auth
from app.keys import (
    user_pk, USER_SK, project_pk, PROJECT_SK,
    gsi5_review_pk, GSI5_PK, GSI_BY_REVIEW_STATUS,
    admin_audit_pk, ADMIN_AUDIT_SK,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _write_audit(
    table,
    actor_user_id: str,
    action: str,
    target_type: str,
    target_id: str,
    reason: Optional[str] = None,
) -> None:
    audit_id = str(uuid4())
    item = {
        "PK": admin_audit_pk(audit_id),
        "SK": ADMIN_AUDIT_SK,
        "auditId": audit_id,
        "actorUserId": actor_user_id,
        "action": action,
        "targetType": target_type,
        "targetId": target_id,
        "createdAt": _now(),
    }
    if reason:
        item["reason"] = reason
    table.put_item(Item=item)


async def require_admin(claims: dict = Depends(require_auth)):
    table = get_table()
    user = table.get_item(Key={"PK": user_pk(claims["sub"]), "SK": USER_SK}).get("Item")
    if not user or user.get("role") != "admin":
        raise HTTPException(403, detail={"code": "ADMIN_ONLY", "message": "Admins only"})
    return claims


@router.get("/projects")
def list_pending(claims: dict = Depends(require_admin)):
    table = get_table()
    res = table.query(
        IndexName=GSI_BY_REVIEW_STATUS,
        KeyConditionExpression=Key(GSI5_PK).eq(gsi5_review_pk("pending_review")),
        ScanIndexForward=True,
    )
    return res.get("Items", [])


@router.get("/projects/{project_id}")
def get_admin_project(project_id: str, claims: dict = Depends(require_admin)):
    table = get_table()
    project = table.get_item(Key={"PK": project_pk(project_id), "SK": PROJECT_SK}).get("Item")
    if not project:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})
    owner = table.get_item(Key={"PK": user_pk(project["userId"]), "SK": USER_SK}).get("Item")
    return {
        "project": project,
        "owner": owner,
    }


@router.put("/projects/{project_id}/approve")
def approve_project(project_id: str, claims: dict = Depends(require_admin)):
    table = get_table()
    project = table.get_item(Key={"PK": project_pk(project_id), "SK": PROJECT_SK}).get("Item")
    if not project:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})

    now = _now()
    table.update_item(
        Key={"PK": project_pk(project_id), "SK": PROJECT_SK},
        UpdateExpression="SET reviewStatus = :pub, updatedAt = :now, #gsi5 = :newreview",
        ExpressionAttributeNames={"#gsi5": GSI5_PK},
        ExpressionAttributeValues={":pub": "published", ":now": now, ":newreview": gsi5_review_pk("published")},
    )
    table.update_item(
        Key={"PK": user_pk(project["userId"]), "SK": USER_SK},
        UpdateExpression="SET hasProject = :t, updatedAt = :now",
        ExpressionAttributeValues={":t": True, ":now": now},
    )
    _write_audit(table, claims["sub"], "approve_project", "project", project_id)
    return {"approved": True}


class RejectProjectInput(BaseModel):
    reason: str


@router.put("/projects/{project_id}/reject")
def reject_project(project_id: str, body: RejectProjectInput, claims: dict = Depends(require_admin)):
    table = get_table()
    reason = body.reason.strip()
    if not reason:
        raise HTTPException(400, detail={"code": "BAD_REQUEST", "message": "Rejection reason is required"})
    project = table.get_item(Key={"PK": project_pk(project_id), "SK": PROJECT_SK}).get("Item")
    if not project:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})
    now = _now()
    table.update_item(
        Key={"PK": project_pk(project_id), "SK": PROJECT_SK},
        UpdateExpression="SET reviewStatus = :rej, updatedAt = :now, rejectionReason = :r, #gsi5 = :newreview",
        ExpressionAttributeNames={"#gsi5": GSI5_PK},
        ExpressionAttributeValues={":rej": "rejected", ":now": now, ":r": reason, ":newreview": gsi5_review_pk("rejected")},
    )
    _write_audit(table, claims["sub"], "reject_project", "project", project_id, reason)
    return {"rejected": True}


@router.put("/projects/{project_id}/unlock")
def unlock_project(project_id: str, claims: dict = Depends(require_admin)):
    table = get_table()
    project = table.get_item(Key={"PK": project_pk(project_id), "SK": PROJECT_SK}).get("Item")
    if not project:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})
    table.update_item(
        Key={"PK": project_pk(project_id), "SK": PROJECT_SK},
        UpdateExpression="REMOVE evaluationLockedUntil SET updatedAt = :now",
        ExpressionAttributeValues={":now": _now()},
    )
    _write_audit(table, claims["sub"], "unlock_project", "project", project_id)
    return {"unlocked": True}


@router.get("/users")
def list_users(claims: dict = Depends(require_admin)):
    table = get_table()
    res = table.scan(
        FilterExpression="SK = :profile",
        ExpressionAttributeValues={":profile": USER_SK},
    )
    return res.get("Items", [])


class RoleUpdate(BaseModel):
    role: Literal["member", "admin"]


@router.put("/users/{user_id}/role")
def update_role(user_id: str, body: RoleUpdate, claims: dict = Depends(require_admin)):
    table = get_table()
    table.update_item(
        Key={"PK": user_pk(user_id), "SK": USER_SK},
        UpdateExpression="SET #role = :role, updatedAt = :now",
        ExpressionAttributeNames={"#role": "role"},
        ExpressionAttributeValues={":role": body.role, ":now": _now()},
    )
    _write_audit(table, claims["sub"], "update_user_role", "user", user_id, f"role={body.role}")
    return {"updated": True}
