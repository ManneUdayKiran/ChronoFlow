from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from app.models.user import User

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


async def authenticate_user(username: str, password: str) -> Optional[User]:
    """Authenticate a user by username and password"""
    user = await User.find_one({"username": username, "disabled": False})
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    
    # Update last login time
    user.last_login = datetime.utcnow()
    await user.save()
    
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a new JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await User.get(user_id)
    if user is None or user.disabled:
        raise credentials_exception
    
    return user


async def create_user(email: str, username: str, password: str, full_name: Optional[str] = None) -> User:
    """Create a new user"""
    # Check if user already exists
    existing_email = await User.find_one({"email": email})
    if existing_email:
        raise ValueError("Email already registered")
    
    existing_username = await User.find_one({"username": username})
    if existing_username:
        raise ValueError("Username already taken")
    
    # Create new user
    hashed_password = get_password_hash(password)
    
    user = User(
        email=email,
        username=username,
        hashed_password=hashed_password,
        full_name=full_name,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await user.insert()
    return user