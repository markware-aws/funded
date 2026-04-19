from typing import Optional
import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

_jwks_cache: Optional[dict] = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600  # refresh keys every hour

JWKS_URL = (
    f"https://cognito-idp.{settings.aws_region}.amazonaws.com"
    f"/{settings.cognito_user_pool_id}/.well-known/jwks.json"
)
ISSUER = (
    f"https://cognito-idp.{settings.aws_region}.amazonaws.com"
    f"/{settings.cognito_user_pool_id}"
)

security = HTTPBearer(auto_error=False)


async def _get_jwks() -> dict:
    import time
    global _jwks_cache, _jwks_fetched_at
    if _jwks_cache is None or time.time() - _jwks_fetched_at > _JWKS_TTL:
        async with httpx.AsyncClient() as client:
            r = await client.get(JWKS_URL)
            r.raise_for_status()
            _jwks_cache = r.json()
            _jwks_fetched_at = time.time()
    return _jwks_cache


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    if not credentials:
        return None
    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        header = jwt.get_unverified_header(token)
        key = next((k for k in jwks["keys"] if k["kid"] == header["kid"]), None)
        if not key:
            return None
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Cognito access tokens use client_id not aud
            issuer=ISSUER,
        )
        # Verify token was issued for our app client
        if claims.get("client_id") != settings.cognito_client_id:
            return None
        return claims
    except JWTError:
        return None
    except Exception:
        return None


async def require_auth(
    claims: Optional[dict] = Depends(get_current_user),
) -> dict:
    if not claims:
        raise HTTPException(
            status_code=401,
            detail={"code": "UNAUTHORIZED", "message": "Unauthorized"},
        )
    return claims
