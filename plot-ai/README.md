# Creative Narrative Visualization Tool

A full-stack application for creating, managing, and visualizing creative stories. Built with Django REST Framework backend and React frontend.

## Features

### 🏗️ Backend (Django)
- **Story Management**: Create, edit, and organize stories with chapters and characters
- **Interactive Interviews**: Build questionnaires for story development
- **Visualization Pipeline**: Generate various types of story visualizations
- **User Authentication**: Secure user-based story management
- **REST API**: Complete API for frontend integration

### 🎨 Frontend (React)
- **Modern UI**: Material-UI based responsive interface
- **Story Dashboard**: Intuitive story management interface
- **Visualization Gallery**: Browse and create story visualizations
- **Real-time Updates**: Live status updates for processing jobs
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend/plot-backend
   ```

2. Activate virtual environment:
   ```bash
   source .venv/bin/activate
   ```

3. Install dependencies (if not already done):
   ```bash
   uv sync
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Create superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Start Django server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start React server:
   ```bash
   npm start
   ```

## Access the Application

- **Frontend**: http://localhost:3000 (or 3001 if 3000 is occupied)
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/
- **API Browser**: http://localhost:8000/api/auth/login/

## Default Login

- **Username**: `admin`
- **Password**: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/user/` - Get current user

### Stories
- `GET /api/stories/` - List user stories
- `POST /api/stories/` - Create story
- `GET /api/stories/{id}/` - Get story details
- `PUT /api/stories/{id}/` - Update story
- `DELETE /api/stories/{id}/` - Delete story

### Visualizations
- `GET /api/visualization-requests/` - List requests
- `POST /api/visualization-requests/` - Create visualization
- `GET /api/visualizations/` - List generated visualizations

## Visualization Types

- **Timeline**: Story events chronology
- **Character Map**: Character relationship networks
- **Plot Diagram**: Story structure analysis
- **Mood Chart**: Emotional tone progression
- **Word Cloud**: Key themes and terminology

## Architecture

```
Frontend (React + Material-UI)
        ↓ HTTP/REST API
Backend (Django + DRF)
        ↓ Database
SQLite (Development)
```

## Development Notes

- CORS is configured for localhost:3000 and 3001
- Session-based authentication
- UUID primary keys for security
- Browsable API for development
- Real-time status updates ready

## Next Steps

1. Implement actual visualization generation logic
2. Add AI integration for story analysis
3. Implement real-time updates with WebSockets
4. Add collaborative features
5. Deploy to production

## Technology Stack

**Backend:**
- Django 5.2
- Django REST Framework
- django-cors-headers
- Google Generative AI (ready for integration)
- SQLite (development)

**Frontend:**
- React 19
- Material-UI
- Axios for API calls
- React Router for navigation

Your creative narrative visualization tool is now ready for development and testing!