import json
import os
import boto3
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone

from app.db import get_table
from app.auth import require_auth
from app.keys import project_pk, PROJECT_SK
from app.config import settings

router = APIRouter(prefix="/projects/{project_id}/evaluate", tags=["evaluation"])

_lambda_client = None


def _get_lambda_client():
    global _lambda_client
    if _lambda_client is None:
        _lambda_client = boto3.client("lambda", region_name=settings.aws_region)
    return _lambda_client


@router.post("")
def trigger_evaluation(project_id: str, claims: dict = Depends(require_auth)):
    table = get_table()
    project = table.get_item(Key={"PK": project_pk(project_id), "SK": PROJECT_SK}).get("Item")

    if not project:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Project not found"})
    if project["userId"] != claims["sub"]:
        raise HTTPException(403, detail={"code": "NOT_OWNER", "message": "Not the project owner"})
    if project["reviewStatus"] != "published":
        raise HTTPException(400, detail={"code": "PROJECT_NOT_PUBLISHED", "message": "Project must be published before evaluation"})
    if project["evaluationStatus"] in ("pending", "complete"):
        raise HTTPException(400, detail={"code": "EVALUATION_ALREADY_REQUESTED", "message": "Evaluation already requested or complete"})

    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={"PK": project_pk(project_id), "SK": PROJECT_SK},
        UpdateExpression="SET evaluationStatus = :p, updatedAt = :now",
        ExpressionAttributeValues={":p": "pending", ":now": now},
    )

    # Invoke the same Lambda asynchronously
    function_name = os.environ.get("AWS_LAMBDA_FUNCTION_NAME", "")
    _get_lambda_client().invoke(
        FunctionName=function_name,
        InvocationType="Event",
        Payload=json.dumps({"projectId": project_id}).encode(),
    )

    return {"status": "pending"}
