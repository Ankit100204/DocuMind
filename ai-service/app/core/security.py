from fastapi import Header, HTTPException
from app.core.config import settings


def verify_internal_key(x_internal_api_key: str = Header(default=None)):
    if not x_internal_api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing internal API key"
        )

    if x_internal_api_key != settings.internal_api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid internal API key"
        )

    return True