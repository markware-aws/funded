import boto3
import logging
from app.config import settings

logger = logging.getLogger(__name__)

_cognito_client = None


def _get_cognito():
    global _cognito_client
    if _cognito_client is None:
        _cognito_client = boto3.client("cognito-idp", region_name=settings.aws_region)
    return _cognito_client


def _list_users_by_email(email: str) -> list[dict]:
    res = _get_cognito().list_users(
        UserPoolId=settings.cognito_user_pool_id,
        Filter=f'email = "{email}"',
    )
    return res.get("Users", [])


def _is_external_username(username: str) -> bool:
    """External usernames are formatted as 'google_<subject>'."""
    return "_" in username and username.split("_", 1)[0].lower() in {"google"}


def _find_native_user(users: list[dict]) -> dict | None:
    return next(
        (u for u in users if not _is_external_username(u.get("Username", ""))),
        None,
    )


def _handle_external_provider(event: dict) -> dict:
    """
    Google sign-in: if a native account exists for the same email,
    link the Google identity to it so both methods share one record.
    """
    attrs = {a["Name"]: a["Value"] for a in event["request"]["userAttributes"]}
    email = attrs.get("email", "")
    username = event.get("userName", "")  # format: "google_<subject>"

    if not email or not username.startswith("google_"):
        return event

    provider_subject = username.split("_", 1)[1]
    users = _list_users_by_email(email)
    native = _find_native_user(users)

    if not native:
        logger.info("No native account for email=%s — Google account will be created standalone", email)
        return event

    try:
        _get_cognito().admin_link_provider_for_user(
            UserPoolId=settings.cognito_user_pool_id,
            DestinationUser={
                "ProviderName": "Cognito",
                "ProviderAttributeValue": native["Username"],
            },
            SourceUser={
                "ProviderName": "Google",
                "ProviderAttributeName": "Cognito_Subject",
                "ProviderAttributeValue": provider_subject,
            },
        )
        logger.info("Linked Google identity to native account for email=%s", email)
    except Exception as e:
        logger.warning("Failed to link Google identity for email=%s: %s", email, e)

    # Auto-confirm so Cognito doesn't block the flow
    event["response"]["autoConfirmUser"] = True
    event["response"]["autoVerifyEmail"] = True
    return event


def _handle_native_signup(event: dict) -> dict:
    """
    Email/password sign-up: if a Google-only account already exists for
    this email, block the sign-up and direct the user to Google sign-in.
    """
    attrs = {a["Name"]: a["Value"] for a in event["request"]["userAttributes"]}
    email = attrs.get("email", "")

    if not email:
        return event

    users = _list_users_by_email(email)
    has_native = _find_native_user(users) is not None
    has_external = any(_is_external_username(u.get("Username", "")) for u in users)

    if has_external and not has_native:
        raise Exception(
            "An account with this email already exists. Please sign in with Google."
        )

    return event


def handle(event: dict, context) -> dict:
    trigger = event.get("triggerSource", "")

    if trigger == "PreSignUp_ExternalProvider":
        return _handle_external_provider(event)

    if trigger in ("PreSignUp_SignUp", "PreSignUp_AdminCreateUser"):
        return _handle_native_signup(event)

    return event
