import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from boto3.dynamodb.conditions import Key
import base64, json

from app.db import get_table
from app.auth import get_current_user, require_auth
from app.keys import (
    project_pk, PROJECT_SK, user_pk, USER_SK,
    gsi1_project_pk, gsi1_likes_sk,
    gsi2_user_pk, gsi3_category_pk,
    GSI1_PK, GSI1_SK, GSI2_PK, GSI2_SK, GSI3_PK, GSI3_SK,
    GSI4_PK, GSI5_PK, GSI5_SK,
    GSI_BY_LIKES, GSI_BY_USER, GSI_BY_CATEGORY, GSI_BY_SCORE,
)
from app.models.project import Project, CreateProjectInput, UpdateProjectInput

router = APIRouter(prefix="/projects", tags=["projects"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_project(table, project_id: str) -> Optional[dict]:
    res = table.get_item(Key={"PK": project_pk(project_id), "SK": PROJECT_SK})
    return res.get("Item")


def _hydrate_liked(table, project: dict, user_id: Optional[str]) -> dict:
    if not user_id:
        return project
    res = table.get_item(Key={"PK": project_pk(project["projectId"]), "SK": f"LIKE#{user_id}"})
    return {**project, "likedByMe": "Item" in res}


@router.get("")
def list_projects(
    sort: str = Query("likes"),
    category: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    cursor: Optional[str] = Query(None),
    claims: Optional[dict] = Depends(get_current_user),
):
    table = get_table()
    exclusive_start = json.loads(base64.b64decode(cursor).decode()) if cursor else None
    kwargs = {"ScanIndexForward": False, "Limit": limit}
    if exclusive_start:
        kwargs["ExclusiveStartKey"] = exclusive_start

    if category:
        res = table.query(
            IndexName=GSI_BY_CATEGORY,
            KeyConditionExpression=Key(GSI3_PK).eq(gsi3_category_pk(category)),
            FilterExpression="reviewStatus = :pub",
            ExpressionAttributeValues={":pub": "published"},
            **kwargs,
        )
    elif sort == "score":
        res = table.query(
            IndexName=GSI_BY_SCORE,
            KeyConditionExpression=Key(GSI4_PK).eq("PROJECT"),
            FilterExpression="reviewStatus = :pub",
            ExpressionAttributeValues={":pub": "published"},
            **kwargs,
        )
    else:
        res = table.query(
            IndexName=GSI_BY_LIKES,
            KeyConditionExpression=Key(GSI1_PK).eq(gsi1_project_pk()),
            FilterExpression="reviewStatus = :pub",
            ExpressionAttributeValues={":pub": "published"},
            **kwargs,
        )

    projects = res.get("Items", [])
    last_key = res.get("LastEvaluatedKey")
    next_cursor = base64.b64encode(json.dumps(last_key).encode()).decode() if last_key else None
    return {"projects": projects, "pagination": {"nextCursor": next_cursor, "limit": limit}}


@router.post("", status_code=201)
def create_project(body: CreateProjectInput, claims: dict = Depends(require_auth)):
    table = get_table()
    user_id = claims["sub"]

    # Enforce max 5 projects per user
    existing = table.query(
        IndexName=GSI_BY_USER,
        KeyConditionExpression=Key(GSI2_PK).eq(gsi2_user_pk(user_id)),
        Select="COUNT",
    )
    if existing.get("Count", 0) >= 5:
        raise HTTPException(
            409,
            detail={"code": "PROJECT_LIMIT_REACHED", "message": "You have reached the maximum of 5 projects"},
        )

    project_id = str(uuid.uuid4())
    now = _now()
    item = {
        "PK": project_pk(project_id), "SK": PROJECT_SK,
        GSI1_PK: gsi1_project_pk(), GSI1_SK: gsi1_likes_sk(0),
        GSI2_PK: gsi2_user_pk(user_id), GSI2_SK: now,
        GSI3_PK: gsi3_category_pk(body.category), GSI3_SK: gsi1_likes_sk(0),
        GSI5_PK: "REVIEW#draft", GSI5_SK: now,
        "projectId": project_id,
        "userId": user_id,
        **body.model_dump(),
        "likeCount": 0,
        "reviewStatus": "draft",
        "evaluationStatus": "not_requested",
        "createdAt": now,
        "updatedAt": now,
    }
    table.put_item(Item=item)
    return item


@router.post("/{project_id}/submit", status_code=200)
def submit_project(project_id: str, claims: dict = Depends(require_auth)):
    table = get_table()
    project = _get_project(table, project_id)
    if not project:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})
    if project["userId"] != claims["sub"]:
        raise HTTPException(403, detail={"code": "NOT_OWNER", "message": "Not the project owner"})
    if project["reviewStatus"] != "draft":
        raise HTTPException(400, detail={"code": "BAD_REQUEST", "message": "Only drafts can be submitted for review"})

    now = _now()
    table.update_item(
        Key={"PK": project_pk(project_id), "SK": PROJECT_SK},
        UpdateExpression="SET reviewStatus = :s, #gsi5pk = :gpk, #gsi5sk = :gsk, updatedAt = :now",
        ExpressionAttributeNames={"#gsi5pk": GSI5_PK, "#gsi5sk": GSI5_SK},
        ExpressionAttributeValues={":s": "pending_review", ":gpk": "REVIEW#pending_review", ":gsk": now, ":now": now},
    )
    return {"submitted": True}


@router.get("/{project_id}")
def get_project(
    project_id: str,
    claims: Optional[dict] = Depends(get_current_user),
):
    table = get_table()
    project = _get_project(table, project_id)
    if not project:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})
    user_id = claims.get("sub") if claims else None
    if project["reviewStatus"] != "published" and user_id != project["userId"]:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})
    return _hydrate_liked(table, project, user_id)


@router.put("/{project_id}")
def update_project(
    project_id: str,
    body: UpdateProjectInput,
    claims: dict = Depends(require_auth),
):
    table = get_table()
    project = _get_project(table, project_id)
    if not project:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})
    if project["userId"] != claims["sub"]:
        raise HTTPException(403, detail={"code": "NOT_OWNER", "message": "Not the project owner"})

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, detail={"code": "BAD_REQUEST", "message": "No updatable fields"})

    now = _now()
    updates["updatedAt"] = now
    if project["reviewStatus"] == "rejected":
        updates["reviewStatus"] = "pending_review"

    expr = "SET " + ", ".join(f"#f{i} = :v{i}" for i, k in enumerate(updates))
    names = {f"#f{i}": k for i, k in enumerate(updates)}
    values = {f":v{i}": v for i, v in enumerate(updates.values())}

    res = table.update_item(
        Key={"PK": project_pk(project_id), "SK": PROJECT_SK},
        UpdateExpression=expr,
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
        ReturnValues="ALL_NEW",
    )
    return res["Attributes"]


@router.delete("/{project_id}")
def delete_project(project_id: str, claims: dict = Depends(require_auth)):
    table = get_table()
    project = _get_project(table, project_id)
    if not project:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})
    if project["userId"] != claims["sub"]:
        raise HTTPException(403, detail={"code": "NOT_OWNER", "message": "Not the project owner"})
    table.delete_item(Key={"PK": project_pk(project_id), "SK": PROJECT_SK})
    return {"deleted": True}
