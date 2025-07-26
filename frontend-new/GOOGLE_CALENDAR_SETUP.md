# Google Calendar API Integration Setup

## Overview

This guide explains how to set up Google Calendar API integration for the Calendar component to sync user events with their Google Calendar.

## Prerequisites

1. A Google Cloud Platform account
2. A project created in Google Cloud Console
3. Google Calendar API enabled for your project

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API for your project

### 2. Create API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Save the API Key for `VITE_GOOGLE_API_KEY`
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure OAuth consent screen if not done already
6. Select "Web application" as application type
7. Add your domain to "Authorized JavaScript origins" (e.g., `http://localhost:5173` for development)
8. Save the Client ID for `VITE_GOOGLE_CLIENT_ID`

### 3. Environment Variables

Create a `.env` file in the frontend-new directory:

```bash
# Copy from .env.example and fill in your values
VITE_API_URL=http://localhost:8000/api/v1
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_api_key
```

### 4. OAuth Consent Screen Configuration

1. In Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type for testing
3. Fill in required fields:
   - App name: "ChronoFlow"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
5. Add test users (your email addresses) for testing

## Features Implemented

### 1. Dynamic Data Loading

- Loads calendar events from backend API
- Displays user-specific events only
- Real-time event creation and updates

### 2. Google Calendar Integration

- OAuth 2.0 authentication with Google
- Read access to user's Google Calendar events
- Sync Google Calendar events with local calendar
- Visual distinction between local and Google events

### 3. Event Management

- Create new events with proper backend integration
- Event details modal with all event information
- Support for different event types (Work, Personal, Meeting, etc.)
- Form validation and error handling

### 4. Enhanced UI/UX

- Loading states during API calls
- Success/error messages for user feedback
- Google Calendar connection status indicator
- Sync button for manual refresh

## Backend Integration

The component uses the following API endpoints:

- `GET /api/v1/calendar` - Fetch user events
- `POST /api/v1/calendar` - Create new event
- `PUT /api/v1/calendar/{id}` - Update event
- `DELETE /api/v1/calendar/{id}` - Delete event

Event data structure matches the backend schema:

```typescript
{
  title: string;
  description?: string;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  event_type: 'WORK' | 'PERSONAL' | 'MEETING' | 'TASK' | 'BREAK' | 'OTHER';
  location?: string;
  all_day: boolean;
  color?: string;
}
```

## Security Considerations

1. **API Keys**: Never commit real API keys to version control
2. **OAuth Scopes**: Request minimal required permissions
3. **CORS**: Configure proper CORS settings for your domain
4. **Rate Limiting**: Implement proper rate limiting for API calls

## Troubleshooting

### Common Issues:

1. **"Invalid origin"**: Add your domain to authorized origins in Google Console
2. **"Access blocked"**: Ensure OAuth consent screen is properly configured
3. **"API not enabled"**: Enable Google Calendar API in Google Cloud Console
4. **"Quota exceeded"**: Check API usage limits in Google Console

### Development Testing:

- Use `http://localhost:5173` as authorized origin for Vite dev server
- Add test users to OAuth consent screen during development
- Check browser console for detailed error messages

## Production Deployment

1. Update authorized origins with production domain
2. Set up proper environment variables in production
3. Configure OAuth consent screen for production use
4. Monitor API usage and set up billing alerts

## Future Enhancements

1. Two-way sync (create events in Google Calendar from the app)
2. Multiple calendar support
3. Event reminders and notifications
4. Recurring events support
5. Calendar sharing capabilities
