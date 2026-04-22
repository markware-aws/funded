from mangum import Mangum
from app.main import app

# Mangum wraps the FastAPI ASGI app for API Gateway
_api_handler = Mangum(app, lifespan="off")


def handler(event: dict, context) -> dict:
    """Single Lambda entry point — routes by event shape."""

    # Cognito triggers — route by triggerSource
    if "triggerSource" in event:
        trigger = event.get("triggerSource", "")
        if trigger.startswith("PreSignUp_"):
            from app.triggers.pre_signup import handle
            return handle(event, context)
        from app.triggers.post_confirmation import handle
        return handle(event, context)

    # EventBridge scheduled event (GitHub star refresh)
    if event.get("source") == "aws.events":
        from app.triggers.github_refresh import handle
        handle(event, context)
        return {}

    # Async self-invocation from evaluation route
    if "projectId" in event and "requestContext" not in event:
        from app.triggers.evaluation_worker import handle
        handle(event, context)
        return {}

    # API Gateway / HTTP request
    return _api_handler(event, context)
