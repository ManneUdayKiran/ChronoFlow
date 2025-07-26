# ChronoFlow Backend API

This is the backend API for ChronoFlow, a productivity application that helps users manage their time effectively with task management, calendar integration, and Pomodoro technique support.

## Features

- **User Authentication**: Secure JWT-based authentication system
- **Task Management**: Create, read, update, and delete tasks with priorities and deadlines
- **Calendar Integration**: Manage calendar events and sync with external calendars
- **Pomodoro Timer**: Track Pomodoro sessions and manage Pomodoro settings
- **AI Integration**: Leverage OpenRouter API for AI-powered productivity insights

## Tech Stack

- **Framework**: FastAPI
- **Database**: MongoDB with Beanie ODM
- **Authentication**: JWT with python-jose
- **AI Integration**: OpenRouter API
- **API Documentation**: Swagger UI and ReDoc

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── ai.py
│   │   │   ├── auth.py
│   │   │   ├── calendar.py
│   │   │   ├── pomodoro.py
│   │   │   ├── tasks.py
│   │   │   └── users.py
│   │   └── api.py
│   ├── core/
│   │   └── config.py
│   ├── db/
│   │   └── init_db.py
│   ├── models/
│   │   ├── calendar_event.py
│   │   ├── pomodoro_session.py
│   │   ├── pomodoro_settings.py
│   │   ├── task.py
│   │   └── user.py
│   ├── schemas/
│   │   ├── ai.py
│   │   ├── auth.py
│   │   ├── calendar.py
│   │   ├── pomodoro.py
│   │   └── task.py
│   ├── services/
│   │   ├── ai_service.py
│   │   └── auth.py
│   └── main.py
├── .env.example
├── requirements.txt
└── run.py
```

## Getting Started

### Prerequisites

- Python 3.8+
- MongoDB
- OpenRouter API key

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/chronoflow.git
cd chronoflow/backend
```

2. Create a virtual environment

```bash
python -m venv venv
```

3. Activate the virtual environment

```bash
# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

4. Install dependencies

```bash
pip install -r requirements.txt
```

5. Create a `.env` file based on `.env.example`

```bash
cp .env.example .env
```

6. Update the `.env` file with your MongoDB connection string and OpenRouter API key

### Running the Application

```bash
python run.py
```

The API will be available at `http://localhost:8000`.

### API Documentation

Once the application is running, you can access the API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development

### Adding New Endpoints

1. Create a new file in `app/api/endpoints/`
2. Define your router and endpoints
3. Import and include your router in `app/api/api.py`

### Database Models

All database models are defined in the `app/models/` directory using Beanie ODM.

### Environment Variables

See `.env.example` for all available configuration options.

## License

This project is licensed under the MIT License.