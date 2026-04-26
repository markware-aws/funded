from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from boto3.dynamodb.conditions import Key
from app.db import get_table
from app.auth import get_current_user, require_auth
from app.keys import user_pk, USER_SK, GSI2_PK, GSI_BY_USER, gsi2_user_pk
from app.models.user import UpdateUserInput

router = APIRouter(prefix="/users", tags=["users"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/me")
def get_me(claims: dict = Depends(require_auth)):
    table = get_table()
    sub = claims["sub"]
    item = table.get_item(Key={"PK": user_pk(sub), "SK": USER_SK}).get("Item")
    if not item:
        # First login via social provider — create the record from JWT claims
        from botocore.exceptions import ClientError
        from boto3.dynamodb.conditions import Attr

        email = claims.get("email", "")
        name = claims.get("name", "") or email.split("@")[0]
        now = _now()
        item = {
            "PK": user_pk(sub),
            "SK": USER_SK,
            "userId": sub,
            "email": email,
            "name": name,
            "hasProject": False,
            "role": "member",
            "createdAt": now,
            "updatedAt": now,
        }
        try:
            table.put_item(Item=item, ConditionExpression=Attr("PK").not_exists())
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                item = table.get_item(Key={"PK": user_pk(sub), "SK": USER_SK}).get(
                    "Item"
                )
            else:
                raise
    return item


@router.put("/me")
def update_me(body: UpdateUserInput, claims: dict = Depends(require_auth)):
    table = get_table()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(
            400, detail={"code": "BAD_REQUEST", "message": "No updatable fields"}
        )

    now = _now()
    updates["updatedAt"] = now
    expr = "SET " + ", ".join(f"#f{i} = :v{i}" for i, k in enumerate(updates))
    names = {f"#f{i}": k for i, k in enumerate(updates)}
    values = {f":v{i}": v for i, v in enumerate(updates.values())}

    res = table.update_item(
        Key={"PK": user_pk(claims["sub"]), "SK": USER_SK},
        UpdateExpression=expr,
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
        ReturnValues="ALL_NEW",
    )
    return res["Attributes"]


@router.get("/me/project")
def get_my_project(claims: dict = Depends(require_auth)):
    table = get_table()
    res = table.query(
        IndexName=GSI_BY_USER,
        KeyConditionExpression=Key(GSI2_PK).eq(gsi2_user_pk(claims["sub"])),
        Limit=1,
    )
    items = res.get("Items", [])
    return items[0] if items else None


@router.get("/{user_id}/projects")
def get_user_projects(user_id: str, claims: Optional[dict] = Depends(get_current_user)):
    table = get_table()
    viewer_id = claims.get("sub") if claims else None
    res = table.query(
        IndexName=GSI_BY_USER,
        KeyConditionExpression=Key(GSI2_PK).eq(gsi2_user_pk(user_id)),
    )
    projects = res.get("Items", [])
    # Non-owners only see published projects
    if viewer_id != user_id:
        projects = [p for p in projects if p.get("reviewStatus") == "published"]
    return projects


@router.get("/{user_id}")
def get_user(user_id: str, claims: Optional[dict] = Depends(get_current_user)):
    table = get_table()
    item = table.get_item(Key={"PK": user_pk(user_id), "SK": USER_SK}).get("Item")
    if not item:
        raise HTTPException(
            404, detail={"code": "NOT_FOUND", "message": "User not found"}
        )

    # Return full profile to self, public profile to others
    if claims and claims.get("sub") == user_id:
        return item

    return {
        "userId": item["userId"],
        "name": item["name"],
        "avatarUrl": item.get("avatarUrl"),
        "githubUrl": item.get("githubUrl"),
        "hasProject": item["hasProject"],
    }
