# Notification System Documentation

## Overview

Your ChronoFlow application has a comprehensive multi-layered notification system designed to keep users informed and engaged with their productivity sessions. Here's how each type of notification works:

## Types of Notifications

### 1. **In-App UI Notifications (Ant Design)**

**How they work:**

- Appear as toast notifications in the top-right corner of the app
- Automatically disappear after 4.5 seconds (configurable)
- Used for immediate user feedback on actions

**When they appear:**

- ✅ Settings saved successfully
- ❌ API errors (failed to save, network issues)
- ✅ Calendar events created/updated
- ✅ Profile updates
- ⚠️ Validation warnings

**Implementation:**

```typescript
import { message } from "antd";

// Success notification
message.success("Event created successfully");

// Error notification
message.error("Failed to load calendar events");

// Warning notification
message.warning("Please connect to Google Calendar first");
```

### 2. **Pomodoro Session Notifications**

**How they work:**

- Combination of in-app notifications AND browser notifications
- Triggered when timer sessions complete (focus/break/long break)
- Include contextual messages about what to do next

**When they appear:**

- ⏰ Focus session completes → "Time for a break!"
- ☕ Break session completes → "Ready to focus again?"
- 🚀 Long break completes → "Ready for a new cycle?"

**Current Implementation:**

```typescript
// Located in: src/contexts/PomodoroContext.tsx
const handleTimerComplete = () => {
  // Show in-app notification
  showPomodoroNotification(sessionType);

  // Show browser notification (if enabled)
  showBrowserNotification(title, { message: title, description });

  // Play sound (if enabled)
  audioRef.current?.play();
};
```

### 3. **Browser Desktop Notifications**

**How they work:**

- System-level notifications that appear outside the browser
- Persist even when the browser tab is not active
- Require user permission (requested automatically)
- Work even when user is in another application

**When they appear:**

- 🎉 Pomodoro timer completions (with session-specific messages)
- 📅 Calendar reminders (can be implemented)
- ⚠️ Task deadlines approaching (can be implemented)

**Permission Flow:**

1. App requests permission on first load
2. Browser shows permission dialog
3. User grants/denies permission
4. App respects user choice and falls back to in-app notifications

### 4. **Audio Notifications**

**How they work:**

- Plays notification sounds when timer completes
- Uses web audio API with fallback sounds
- Can be enabled/disabled in settings

**Current Implementation:**

- Primary: Audio file from CDN (`mixkit-alarm-digital-clock-beep-989.mp3`)
- Fallback: Generated tone using Web Audio API (800Hz sine wave)

## Settings Integration

### Notification Preferences

Users can control notifications in Settings > Notifications:

```typescript
// Settings stored in user profile
{
  notification_settings: {
    notifications_enabled: true,        // In-app notifications
    desktop_notifications: true,       // Browser notifications
    sound_enabled: true,               // Audio alerts
    reminder_time: 5                   // Minutes before deadline
  }
}
```

### Settings Controls:

- **Enable Notifications**: Toggle all in-app notifications
- **Desktop Notifications**: Toggle browser/system notifications
- **Sound Alerts**: Toggle audio notifications
- **Reminder Time**: How early to notify about deadlines

## How to Test Notifications

### 1. **Test In-App Notifications**

```bash
# Start the app and try any action
1. Create a calendar event → See success notification
2. Try invalid form data → See error notification
3. Save settings → See success notification
```

### 2. **Test Pomodoro Notifications**

```bash
# Set a short timer for testing
1. Go to Pomodoro page
2. Set focus duration to 1 minute (in settings)
3. Start timer
4. Wait for completion → See notification + hear sound
5. Check different session types (focus/break/long break)
```

### 3. **Test Browser Notifications**

```bash
# Enable desktop notifications
1. Go to Settings > Notifications
2. Enable "Desktop Notifications"
3. Browser will request permission → Allow
4. Start a 1-minute Pomodoro session
5. Switch to another browser tab/application
6. Wait for timer completion → See system notification
```

## Browser Notification Permission States

### **Granted** ✅

- User has allowed notifications
- Desktop notifications will work
- Shows outside browser window

### **Denied** ❌

- User has blocked notifications
- Falls back to in-app notifications only
- No system-level alerts

### **Default** ⏳

- Permission not yet requested
- App will ask for permission when needed
- User can grant/deny at that time

## Advanced Features (Potential Enhancements)

### 1. **Smart Notification Timing**

```typescript
// Don't show notifications during "Do Not Disturb" hours
const isDNDHours = currentHour >= 22 || currentHour <= 7;
if (!isDNDHours) {
  showNotification();
}
```

### 2. **Rich Notifications**

```typescript
// Include action buttons in browser notifications
new Notification("Break Complete!", {
  body: "Ready to focus again?",
  actions: [
    { action: "start", title: "Start Focus Session" },
    { action: "extend", title: "Extend Break 5 min" },
  ],
});
```

### 3. **Progressive Urgency**

```typescript
// Increase notification frequency for overdue tasks
const urgency = calculateUrgency(deadline);
if (urgency === "critical") {
  // More frequent, persistent notifications
}
```

### 4. **Calendar Integration Notifications**

```typescript
// Notify about upcoming calendar events
const upcoming = getUpcomingEvents(15); // 15 minutes
upcoming.forEach((event) => {
  showBrowserNotification(`Upcoming: ${event.title}`, {
    message: "Meeting starts in 15 minutes",
    description: event.location,
  });
});
```

## Troubleshooting

### **No Browser Notifications**

1. Check if permission is granted
2. Verify notification settings are enabled
3. Test with Chrome/Firefox (better support)
4. Check browser's notification settings

### **No Sound**

1. Check if sound is enabled in settings
2. Verify browser allows audio autoplay
3. Check system volume levels
4. Test with different browsers

### **Notifications Not Showing When Tab Inactive**

- This is expected for in-app notifications
- Browser notifications should work when tab is inactive
- Check desktop notification permissions

## File Locations

- **Notification utilities**: `src/utils/notificationUtils.ts`
- **Pomodoro notifications**: `src/contexts/PomodoroContext.tsx`
- **Settings management**: `src/pages/Settings.tsx`
- **Audio files**: `public/` directory (can add custom sounds)

## Browser Support

| Feature               | Chrome | Firefox | Safari | Edge |
| --------------------- | ------ | ------- | ------ | ---- |
| In-app notifications  | ✅     | ✅      | ✅     | ✅   |
| Desktop notifications | ✅     | ✅      | ✅     | ✅   |
| Web Audio API         | ✅     | ✅      | ✅     | ✅   |
| Notification actions  | ✅     | ✅      | ❌     | ✅   |

## Security & Privacy

- **Permission-based**: Desktop notifications require explicit user consent
- **No data collection**: Notifications don't send data to external servers
- **User control**: All notification types can be disabled
- **Local only**: Audio and visual notifications happen locally

This notification system ensures users stay informed about their productivity sessions while respecting their preferences and maintaining a good user experience across different contexts and devices.
