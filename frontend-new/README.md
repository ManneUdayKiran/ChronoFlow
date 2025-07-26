# ChronoFlow Frontend

This is the frontend application for ChronoFlow, a smart time management and productivity app built with React, Vite, and Ant Design.

## Features

- **Dashboard**: View your productivity metrics, upcoming tasks, and AI-powered suggestions
- **Calendar**: Manage your schedule with a full-featured calendar integration
- **Pomodoro Timer**: Stay focused with customizable Pomodoro sessions
- **Task Management**: Create, edit, and organize tasks with priorities and tags
- **Settings**: Customize the app to fit your workflow

## Tech Stack

- **React**: UI library for building component-based interfaces
- **Vite**: Next-generation frontend tooling for faster development
- **TypeScript**: Type-safe JavaScript for better developer experience
- **Ant Design**: UI component library for a polished look and feel
- **Framer Motion**: Animation library for smooth transitions
- **React Router**: Navigation and routing for single-page applications
- **FullCalendar**: Feature-rich calendar component
- **Axios**: HTTP client for API requests

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173

### Building for Production

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── assets/         # Static assets like images and icons
├── components/     # Reusable UI components
├── pages/          # Page components for each route
├── services/       # API services and data fetching
├── utils/          # Utility functions and helpers
├── App.tsx         # Main application component with routing
├── main.tsx        # Application entry point
└── index.css       # Global styles
```

## Key Components

- **MainLayout**: The main layout wrapper with navigation and responsive design
- **Dashboard**: Overview of productivity metrics and upcoming tasks
- **Calendar**: FullCalendar integration for schedule management
- **Pomodoro**: Customizable Pomodoro timer with session tracking
- **AddTask**: Form for creating new tasks with AI suggestions
- **Settings**: User preferences and application configuration

## Styling

The application uses a combination of:

- Ant Design's built-in styling system
- CSS variables for theming
- Framer Motion for animations
- Responsive design for mobile compatibility

## Future Enhancements

- User authentication and profile management
- Data synchronization with backend
- Offline support with local storage
- Advanced analytics and reporting
- Integration with third-party services

## License

MIT
