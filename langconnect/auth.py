"""Auth to resolve user object."""

from typing import Annotated

from fastapi import Depends
from fastapi.exceptions import HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from gotrue.types import User
from starlette.authentication import BaseUser
from supabase import create_client

from langconnect import config

security = HTTPBearer()


class AuthenticatedUser(BaseUser):
    """An authenticated user following the Starlette authentication model."""

    def __init__(self, user_id: str, display_name: str) -> None:
        """Initialize the AuthenticatedUser.

        Args:
            user_id: Unique identifier for the user.
            display_name: Display name for the user.
        """
        self.user_id = user_id
        self._display_name = display_name

    @property
    def is_authenticated(self) -> bool:
        """Return True if the user is authenticated."""
        return True

    @property
    def display_name(self) -> str:
        """Return the display name of the user."""
        return self._display_name

    @property
    def identity(self) -> str:
        """Return the identity of the user. This is a unique identifier."""
        return self.user_id


def get_current_user(authorization: str) -> User:
    """Authenticate a user by validating their JWT token against Supabase.

    This function verifies the provided JWT token by making a request to Supabase.
    It requires the SUPABASE_URL and SUPABASE_KEY environment variables to be
    properly configured.

    Args:
        authorization: JWT token string to validate

    Returns:
        User: A Supabase User object containing the authenticated user's information

    Raises:
        HTTPException: With status code 500 if Supabase configuration is missing
        HTTPException: With status code 401 if token is invalid or authentication fails
    """
    supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
    response = supabase.auth.get_user(authorization)
    user = response.user

    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")
    return user


import logging

logger = logging.getLogger(__name__)


def resolve_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> AuthenticatedUser | None:
    """Resolve user from the credentials."""
    logger.info(f"Resolving user with scheme: {credentials.scheme}")

    if credentials.scheme != "Bearer":
        logger.error(f"Invalid authentication scheme: {credentials.scheme}")
        raise HTTPException(status_code=401, detail="Invalid authentication scheme")

    if not credentials.credentials:
        logger.error("No credentials provided")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if config.IS_TESTING:
        logger.info(f"Testing mode - credentials: {credentials.credentials}")
        if credentials.credentials in {"user1", "user2"}:
            return AuthenticatedUser(credentials.credentials, credentials.credentials)
        raise HTTPException(
            status_code=401, detail="Invalid credentials or user not found"
        )

    logger.info("Attempting to get current user from Supabase")
    try:
        user = get_current_user(credentials.credentials)
        logger.info(f"User resolved successfully: {user.id}")
        return AuthenticatedUser(user.id, user.user_metadata.get("name", "User"))
    except Exception as e:
        logger.error(f"Error resolving user: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
