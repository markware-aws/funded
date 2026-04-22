from datetime import datetime, timezone
from botocore.exceptions import ClientError
from app.db import get_table
from app.keys import user_pk, USER_SK
from boto3.dynamodb.conditions import Attr


def handle(event: dict, context) -> dict:
    attrs = event["request"]["userAttributes"]
    sub = attrs["sub"]
    email = attrs.get("email", "")
    name = attrs.get("name", email.split("@")[0])
    now = datetime.now(timezone.utc).isoformat()

    table = get_table()
    try:
        table.put_item(
            Item={
                "PK": user_pk(sub), "SK": USER_SK,
                "userId": sub, "email": email, "name": name,
                "hasProject": False, "role": "member",
                "createdAt": now, "updatedAt": now,
            },
            ConditionExpression=Attr("PK").not_exists(),
        )
    except ClientError as e:
        if e.response["Error"]["Code"] != "ConditionalCheckFailedException":
            raise  # real failure — let Cognito surface the error

    return event
