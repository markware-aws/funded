from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from boto3.dynamodb.conditions import Attr

from app.db import get_table
from app.auth import require_auth
from app.keys import (
    user_pk, USER_SK, project_pk, PROJECT_SK,
    like_sk, liked_sk, gsi1_likes_sk, GSI1_SK,
)

router = APIRouter(prefix="/projects/{project_id}/like", tags=["likes"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("")
def like_project(project_id: str, claims: dict = Depends(require_auth)):
    table = get_table()

    user = table.get_item(Key={"PK": user_pk(claims["sub"]), "SK": USER_SK}).get("Item")
    if not user or not user.get("hasProject"):
        raise HTTPException(403, detail={"code": "MUST_HAVE_PROJECT", "message": "Submit your own project to like others"})

    project = table.get_item(Key={"PK": project_pk(project_id), "SK": PROJECT_SK}).get("Item")
    if not project or project["reviewStatus"] != "published":
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})

    # Idempotent like
    try:
        table.put_item(
            Item={
                "PK": project_pk(project_id), "SK": like_sk(claims["sub"]),
                "projectId": project_id, "userId": claims["sub"], "createdAt": _now(),
            },
            ConditionExpression=Attr("PK").not_exists(),
        )
    except Exception:
        pass  # already liked

    res = table.update_item(
        Key={"PK": project_pk(project_id), "SK": PROJECT_SK},
        UpdateExpression="SET likeCount = likeCount + :inc, #sk = :newsk",
        ExpressionAttributeNames={"#sk": GSI1_SK},
        ExpressionAttributeValues={":inc": 1, ":newsk": gsi1_likes_sk((project.get("likeCount") or 0) + 1)},
        ReturnValues="ALL_NEW",
    )
    table.put_item(Item={
        "PK": user_pk(claims["sub"]), "SK": liked_sk(project_id),
        "projectId": project_id, "userId": claims["sub"], "createdAt": _now(),
    })
    return {"likeCount": res["Attributes"]["likeCount"]}


@router.delete("")
def unlike_project(project_id: str, claims: dict = Depends(require_auth)):
    table = get_table()

    project = table.get_item(Key={"PK": project_pk(project_id), "SK": PROJECT_SK}).get("Item")
    if not project or project["reviewStatus"] != "published":
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})

    table.delete_item(Key={"PK": project_pk(project_id), "SK": like_sk(claims["sub"])})

    current = project.get("likeCount") or 0
    res = table.update_item(
        Key={"PK": project_pk(project_id), "SK": PROJECT_SK},
        UpdateExpression="SET likeCount = :new, #sk = :newsk",
        ExpressionAttributeNames={"#sk": GSI1_SK},
        ExpressionAttributeValues={":new": max(0, current - 1), ":newsk": gsi1_likes_sk(max(0, current - 1))},
        ReturnValues="ALL_NEW",
    )
    table.delete_item(Key={"PK": user_pk(claims["sub"]), "SK": liked_sk(project_id)})
    return {"likeCount": res["Attributes"]["likeCount"]}
