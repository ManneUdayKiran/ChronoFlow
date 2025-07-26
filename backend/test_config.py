#!/usr/bin/env python3
"""Test script to verify environment configuration is loaded correctly."""

import os
from app.core.config import settings

print("=== ChronoFlow Configuration Test ===")
print(f"Project Name: {settings.PROJECT_NAME}")
print(f"MongoDB URL: {settings.MONGODB_URL[:20]}...")
print(f"MongoDB DB Name: {settings.MONGODB_DB_NAME}")
print(f"OpenRouter API Key: {'SET' if settings.OPENROUTER_API_KEY else 'NOT SET'}")
print(f"OpenRouter API URL: {settings.OPENROUTER_API_URL}")
print(f"OpenRouter Default Model: {settings.OPENROUTER_DEFAULT_MODEL}")
print(f"CORS Origins: {settings.BACKEND_CORS_ORIGINS}")

if settings.OPENROUTER_API_KEY:
    print("✅ OpenRouter API Key is configured")
else:
    print("❌ OpenRouter API Key is NOT configured")

print("\n=== AI Service Test ===")
from app.services.ai_service import ai_service

print(f"AI Service API Key: {'SET' if ai_service.api_key else 'NOT SET'}")
print(f"AI Service Default Model: {ai_service.default_model}")
print(f"AI Service API URL: {ai_service.api_url}")
