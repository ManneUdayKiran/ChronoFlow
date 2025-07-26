from typing import Optional
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    """Token schema for authentication responses"""
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Token payload schema for JWT decoding"""
    sub: Optional[str] = None
    exp: Optional[int] = None


class UserLogin(BaseModel):
    """User login schema"""
    username: str
    password: str


class UserCreate(BaseModel):
    """User registration schema"""
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    """User response schema (without sensitive data)"""
    id: str
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    disabled: bool
    is_superuser: bool
    theme_preference: str
    profile_image: Optional[str] = None