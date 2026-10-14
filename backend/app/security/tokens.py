from datetime import UTC, datetime, timedelta

import jwt
from app.config import settings

ALGORITHM = "HS256"


def create_access_token(user_id: int) -> str:
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "iat": now, "exp": expires_at}, settings.SECRET_KEY, algorithm=ALGORITHM)
