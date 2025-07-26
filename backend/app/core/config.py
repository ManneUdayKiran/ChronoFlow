from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ChronoFlow API"
    PROJECT_DESCRIPTION: str = "Smart Time Management API with AI Integration"
    VERSION: str = "1.0.0"
    
    # CORS configuration
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:5173",  # Frontend Vite dev server
        "http://localhost:4173",  # Frontend Vite preview
        "http://localhost:3000",  # Alternative frontend port
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                # Handle JSON array format
                import json
                return json.loads(v)
            else:
                # Handle comma-separated format
                return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    # MongoDB configuration
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "chronoflow"
    
    # JWT configuration
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # OpenRouter API configuration
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_API_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_DEFAULT_MODEL: str = "anthropic/claude-3-opus:beta"
    
    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore"
    }


settings = Settings()