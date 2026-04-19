import boto3
from boto3.dynamodb.conditions import Key, Attr
from app.config import settings

_resource = None


def get_table():
    global _resource
    if _resource is None:
        kwargs = {"region_name": settings.aws_region}
        if settings.dynamodb_endpoint_url:
            kwargs["endpoint_url"] = settings.dynamodb_endpoint_url
        _resource = boto3.resource("dynamodb", **kwargs)
    return _resource.Table(settings.dynamodb_table_name)
