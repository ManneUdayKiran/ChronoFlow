# ChronoFlow - AI-Powered Time Management

ChronoFlow is an intelligent time management application that uses AI to help users schedule tasks, reduce procrastination, and increase focus through smart integrations and adaptive strategies like the Pomodoro technique. The application leverages OpenRouter API for AI capabilities.

## Features

- **Smart Task Management**: Add tasks manually or via voice input
- **AI-Powered Scheduling**: Get intelligent suggestions for optimal task scheduling
- **AI Scheduler**: Advanced AI-driven task scheduling and optimization
- **Calendar Integration**: Sync with Google Calendar using Google OAuth
- **Adaptive Pomodoro Timer**: Focus sessions tailored to your productivity patterns with session history
- **Voice Assistant**: Create tasks using voice commands with React Speech Recognition
- **Visual Dashboard**: Track your productivity and focus patterns with real-time statistics
- **User Authentication**: Secure JWT-based authentication system
- **Session Management**: Track and analyze your Pomodoro sessions
- **Real-time Notifications**: Desktop and in-app notifications for session completions
- **Responsive UI**: Modern, mobile-friendly interface with Ant Design components
- **Data Persistence**: Local storage with backend synchronization

## Tech Stack

### Frontend

- React 19 with TypeScript
- Vite for build tooling
- Ant Design (antd) for UI components
- Google OAuth integration (@react-oauth/google)
- FullCalendar for calendar visualization
- React Speech Recognition for voice input
- Axios for API communication
- Lottie React for animations
- Framer Motion for smooth transitions
- React Router DOM for navigation

### Backend

- FastAPI with Python 3.8+
- OpenRouter API for AI capabilities (Anthropic Claude integration)
- MongoDB with Beanie ODM for data storage
- JWT for authentication (python-jose)
- Motor for async MongoDB operations
- Passlib with bcrypt for password hashing
- Python-multipart for file uploads
- HTTPX for external API calls
- Pydantic for data validation

### Database

- MongoDB (or SQLite for development)

## Getting Started

### Prerequisites

- Node.js 16+ for frontend
- Python 3.8+ for backend
- MongoDB (local installation or MongoDB Atlas)
- OpenRouter API key (for AI features)
- Google Cloud Platform account with Calendar API enabled (optional)

### Environment Variables

Before running the application, you need to set up environment variables:

#### Backend (.env)

```bash
# Copy from .env.example and fill in your values
cp backend/.env.example backend/.env
```

Required variables:

- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `SECRET_KEY`: JWT secret key (generate a secure random string)
- `MONGODB_URL`: MongoDB connection string
- `MONGODB_DB_NAME`: Database name (default: chronoflow)

#### Frontend (.env)

```bash
# Copy from .env.example and fill in your values
cp frontend-new/.env.example frontend-new/.env
```

Required variables:

- `VITE_API_URL`: Backend API URL (default: http://localhost:8000/api/v1)
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID (for calendar integration)
- `VITE_GOOGLE_API_KEY`: Google API key (for calendar integration)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ChronoFlow
   ```

2. **Set up environment variables** (see Prerequisites section above)

3. **Set up the backend:**

   ```bash
   cd backend

   # Install Python dependencies
   pip install -r requirements.txt

   # Windows
   start.bat

   # macOS/Linux
   chmod +x start.sh
   ./start.sh
   ```

4. **Set up the frontend:**

   ```bash
   cd frontend-new

   # Install Node.js dependencies
   npm install

   # Start development server
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Using Docker

You can also run the entire application using Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:

- Frontend on http://localhost:5173
- Backend on http://localhost:8000
- MongoDB on port 27017

## API Documentation

Once the backend is running, you can access the interactive API documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend

- `python run.py` - Start development server
- `pytest` - Run tests
- `start.bat` (Windows) / `start.sh` (Linux/Mac) - Quick start scripts

## Project Structure

```
├── frontend-new/           # React frontend with Vite
│   ├── public/             # Static files and assets
│   │   ├── blue loading.json # Lottie animation files
│   │   └── favicon.svg     # App favicon
│   └── src/                # Source code
│       ├── components/     # Reusable UI components
│       │   ├── Layout.tsx  # Main app layout
│       │   ├── ProtectedRoute.tsx # Route protection
│       │   └── SessionHistory.tsx # Pomodoro session history
│       ├── contexts/       # React contexts
│       │   └── PomodoroContext.tsx # Pomodoro timer state
│       ├── pages/          # Page components
│       │   ├── Dashboard.tsx    # Main dashboard
│       │   ├── Pomodoro.tsx     # Pomodoro timer
│       │   ├── AddTask.tsx      # Task creation
│       │   ├── Calendar.tsx     # Calendar view
│       │   ├── AIScheduler.tsx  # AI scheduling
│       │   ├── Settings.tsx     # User settings
│       │   └── Auth.tsx         # Authentication
│       ├── services/       # API services
│       │   └── api.ts      # API client and endpoints
│       └── utils/          # Utility functions
│           ├── dateUtils.ts         # Date formatting
│           ├── notificationUtils.ts # Browser notifications
│           ├── storageUtils.ts      # Local storage
│           └── themeUtils.ts        # Theme management
├── backend/                # FastAPI backend
│   ├── app/                # Application code
│   │   ├── api/            # API endpoints
│   │   │   ├── api.py      # Main API router
│   │   │   └── endpoints/  # API route handlers
│   │   │       ├── ai.py           # AI integration
│   │   │       ├── ai_scheduler.py # AI scheduling
│   │   │       ├── auth.py         # Authentication
│   │   │       ├── calendar.py     # Calendar integration
│   │   │       ├── pomodoro.py     # Pomodoro sessions
│   │   │       ├── tasks.py        # Task management
│   │   │       └── users.py        # User management
│   │   ├── core/           # Core functionality
│   │   │   └── config.py   # App configuration
│   │   ├── db/             # Database initialization
│   │   │   └── init_db.py  # Database setup
│   │   ├── models/         # Data models (Beanie/MongoDB)
│   │   │   ├── user.py             # User model
│   │   │   ├── task.py             # Task model
│   │   │   ├── calendar_event.py   # Calendar event model
│   │   │   ├── pomodoro_session.py # Pomodoro session model
│   │   │   └── pomodoro_settings.py # Pomodoro settings model
│   │   ├── schemas/        # Pydantic schemas
│   │   │   ├── auth.py             # Authentication schemas
│   │   │   ├── task.py             # Task schemas
│   │   │   ├── calendar.py         # Calendar schemas
│   │   │   ├── pomodoro.py         # Pomodoro schemas
│   │   │   └── ai.py               # AI schemas
│   │   └── services/       # Business logic
│   │       ├── auth.py             # Authentication service
│   │       └── ai_service.py       # AI integration service
│   ├── scripts/            # Utility scripts
│   │   └── init_sample_data.py # Sample data generation
│   └── tests/              # Backend tests
│       ├── conftest.py     # Test configuration
│       └── test_api.py     # API tests
└── docker-compose.yml      # Docker composition file
```

## Key Features Explained

### Pomodoro Timer

- Customizable focus and break durations
- Auto-start functionality for seamless workflow
- Session history tracking and statistics
- Visual progress indicators with Lottie animations
- Desktop notifications for session completion

### Task Management

- Create, edit, and complete tasks
- Priority levels (low, medium, high, urgent)
- Due date tracking with overdue indicators
- Voice input for hands-free task creation
- AI-powered task optimization

### AI Integration

- Smart scheduling suggestions based on your patterns
- Task prioritization recommendations
- Productivity insights and tips
- Adaptive timer recommendations

### Dashboard Analytics

- Real-time productivity metrics
- Focus time tracking and goals
- Task completion rates
- Productivity streak monitoring
- Visual progress charts

## Troubleshooting

### Common Issues

1. **Backend won't start**

   - Check if MongoDB is running
   - Verify environment variables are set correctly
   - Ensure Python dependencies are installed

2. **Frontend build errors**

   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version (16+ required)
   - Verify environment variables

3. **Authentication issues**

   - Check JWT secret key configuration
   - Verify Google OAuth credentials
   - Clear browser storage and cookies

4. **AI features not working**
   - Verify OpenRouter API key is valid
   - Check API rate limits
   - Ensure internet connection

### Development Notes

- The application uses MongoDB for data persistence
- Local storage is used for offline functionality
- JWT tokens expire after 60 minutes by default
- Pomodoro sessions sync between local and backend storage

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m "Add feature description"`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

MIT
