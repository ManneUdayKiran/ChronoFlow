from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Optional, Dict, Any
from app.models.user import User
from app.models.pomodoro_settings import PomodoroSettings
from app.schemas.auth import UserResponse
from app.schemas.pomodoro import PomodoroSettingsResponse, PomodoroSettingsCreate, PomodoroSettingsUpdate
from app.services.auth import get_current_user

router = APIRouter()


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    full_name: Optional[str] = Body(None),
    theme_preference: Optional[str] = Body(None),
    profile_image: Optional[str] = Body(None),
    notification_settings: Optional[Dict[str, Any]] = Body(None),
    current_user: User = Depends(get_current_user)
):
    """Update user profile information"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Update fields if provided
    if full_name is not None:
        current_user.full_name = full_name
    
    if theme_preference is not None:
        if theme_preference not in ["system", "light", "dark"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid theme preference. Must be 'system', 'light', or 'dark'."
            )
        current_user.theme_preference = theme_preference
    
    if profile_image is not None:
        current_user.profile_image = profile_image
    
    if notification_settings is not None:
        # Merge with existing settings
        current_user.notification_settings.update(notification_settings)
    
    await current_user.save()
    
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        disabled=current_user.disabled,
        is_superuser=current_user.is_superuser,
        theme_preference=current_user.theme_preference,
        profile_image=current_user.profile_image
    )


@router.put("/integrations", response_model=Dict[str, Any])
async def update_user_integrations(
    integrations: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Update user integrations"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Merge with existing integrations
    current_user.integrations.update(integrations)
    await current_user.save()
    
    return current_user.integrations


@router.get("/pomodoro-settings", response_model=PomodoroSettingsResponse)
async def get_pomodoro_settings(current_user: User = Depends(get_current_user)):
    """Get user's Pomodoro settings"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Check if user has Pomodoro settings
    if current_user.pomodoro_settings_id:
        settings = await PomodoroSettings.get(current_user.pomodoro_settings_id)
        if settings:
            return PomodoroSettingsResponse(
                id=str(settings.id),
                user_id=str(settings.user_id),
                focus_duration_minutes=settings.focus_duration_minutes,
                short_break_duration_minutes=settings.short_break_duration_minutes,
                long_break_duration_minutes=settings.long_break_duration_minutes,
                long_break_interval=settings.long_break_interval,
                auto_start_breaks=settings.auto_start_breaks,
                auto_start_pomodoros=settings.auto_start_pomodoros,
                sound_enabled=settings.sound_enabled,
                sound_volume=settings.sound_volume,
                notification_enabled=settings.notification_enabled,
                daily_goal_sessions=settings.daily_goal_sessions,
                created_at=settings.created_at,
                updated_at=settings.updated_at
            )
    
    # Create default settings if not found
    settings = PomodoroSettings(user_id=str(current_user.id))
    await settings.insert()
    
    # Update user with settings ID
    current_user.pomodoro_settings_id = str(settings.id)
    await current_user.save()
    
    return PomodoroSettingsResponse(
        id=str(settings.id),
        user_id=str(settings.user_id),
        focus_duration_minutes=settings.focus_duration_minutes,
        short_break_duration_minutes=settings.short_break_duration_minutes,
        long_break_duration_minutes=settings.long_break_duration_minutes,
        long_break_interval=settings.long_break_interval,
        auto_start_breaks=settings.auto_start_breaks,
        auto_start_pomodoros=settings.auto_start_pomodoros,
        sound_enabled=settings.sound_enabled,
        sound_volume=settings.sound_volume,
        notification_enabled=settings.notification_enabled,
        daily_goal_sessions=settings.daily_goal_sessions,
        created_at=settings.created_at,
        updated_at=settings.updated_at
    )


@router.put("/pomodoro-settings", response_model=PomodoroSettingsResponse)
async def update_pomodoro_settings(
    settings_update: PomodoroSettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update user's Pomodoro settings"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Get existing settings or create new ones
    if current_user.pomodoro_settings_id:
        settings = await PomodoroSettings.get(current_user.pomodoro_settings_id)
        if not settings:
            settings = PomodoroSettings(user_id=str(current_user.id))
            await settings.insert()
            current_user.pomodoro_settings_id = str(settings.id)
            await current_user.save()
    else:
        settings = PomodoroSettings(user_id=str(current_user.id))
        await settings.insert()
        current_user.pomodoro_settings_id = str(settings.id)
        await current_user.save()
    
    # Update fields if provided
    update_data = settings_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    await settings.save()
    
    return PomodoroSettingsResponse(
        id=str(settings.id),
        user_id=str(settings.user_id),
        focus_duration_minutes=settings.focus_duration_minutes,
        short_break_duration_minutes=settings.short_break_duration_minutes,
        long_break_duration_minutes=settings.long_break_duration_minutes,
        long_break_interval=settings.long_break_interval,
        auto_start_breaks=settings.auto_start_breaks,
        auto_start_pomodoros=settings.auto_start_pomodoros,
        sound_enabled=settings.sound_enabled,
        sound_volume=settings.sound_volume,
        notification_enabled=settings.notification_enabled,
        daily_goal_sessions=settings.daily_goal_sessions,
        created_at=settings.created_at,
        updated_at=settings.updated_at
    )