from datetime import datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from boto3.dynamodb.conditions import Key
from pydantic import BaseModel

from app.db import get_table
from app.auth import require_auth
from app.keys import (
    user_pk, USER_SK, project_pk, PROJECT_SK,
    gsi5_review_pk, GSI5_PK, GSI_BY_REVIEW_STATUS,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


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
    return {"approved": True}


@router.put("/projects/{project_id}/reject")
def reject_project(project_id: str, reason: str = "", claims: dict = Depends(require_admin)):
    table = get_table()
    now = _now()
    table.update_item(
        Key={"PK": project_pk(project_id), "SK": PROJECT_SK},
        UpdateExpression="SET reviewStatus = :rej, updatedAt = :now, rejectionReason = :r, #gsi5 = :newreview",
        ExpressionAttributeNames={"#gsi5": GSI5_PK},
        ExpressionAttributeValues={":rej": "rejected", ":now": now, ":r": reason, ":newreview": gsi5_review_pk("rejected")},
    )
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
    return {"updated": True}
