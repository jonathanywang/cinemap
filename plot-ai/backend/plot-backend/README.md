# Creative Narrative Visualization Tool - Django Backend MVP

A Django REST API backend for a creative narrative visualization tool that helps users create, analyze, and visualize stories with **AI-powered Mermaid flowchart generation** using Google's Gemini AI.

## Features

### Core Models
- **Stories**: Create and manage narrative content with chapters and characters
- **Characters**: Define story characters with roles and descriptions
- **Chapters**: Organize stories into structured chapters
- **Interviews**: Create interactive questionnaires for story development
- **Visualization Requests**: Generate different types of story visualizations
- **Processing Jobs**: Handle background processing tasks

### 🎨 AI-Powered Features
- **Mermaid Flowchart Generation**: AI-generated flowcharts from story content or custom descriptions
- **Gemini AI Integration**: Powered by Google's Gemini AI for intelligent diagram creation
- **SVG Export**: Generate downloadable SVG files from Mermaid diagrams
- **Fallback System**: Robust template-based generation when AI is unavailable
- **Interactive Web Interface**: Browser-based flowchart generation and testing

### API Endpoints

#### Stories
- `GET /api/stories/` - List all user stories
- `POST /api/stories/` - Create a new story
- `GET /api/stories/{id}/` - Get story details
- `PUT /api/stories/{id}/` - Update story
- `DELETE /api/stories/{id}/` - Delete story
- `GET /api/stories/{id}/characters/` - Get story characters
- `GET /api/stories/{id}/chapters/` - Get story chapters

#### Characters
- `GET /api/characters/` - List characters
- `POST /api/characters/` - Create character
- `GET /api/characters/{id}/` - Get character details
- `PUT /api/characters/{id}/` - Update character
- `DELETE /api/characters/{id}/` - Delete character

#### Chapters
- `GET /api/chapters/` - List chapters
- `POST /api/chapters/` - Create chapter
- `GET /api/chapters/{id}/` - Get chapter details
- `PUT /api/chapters/{id}/` - Update chapter
- `DELETE /api/chapters/{id}/` - Delete chapter

#### Interviews
- `GET /api/interviews/` - List interviews
- `POST /api/interviews/` - Create interview
- `GET /api/interviews/{id}/` - Get interview details
- `GET /api/interviews/{id}/responses/` - Get user responses
- `POST /api/interviews/{id}/submit_response/` - Submit response to question

#### Visualizations
- `GET /api/visualization-requests/` - List visualization requests
- `POST /api/visualization-requests/` - Request new visualization
- `GET /api/visualization-requests/{id}/visualization/` - Get generated visualization
- `GET /api/visualizations/` - List generated visualizations
- `GET /api/processing-jobs/` - List processing jobs
- `GET /api/processing-jobs/active/` - Get active jobs

#### 🎨 Mermaid Flowchart Generation
- `POST /api/mermaid/generate/` - Generate flowchart from description
- `POST /api/mermaid/story/{story_id}/` - Generate flowchart from story content
- `POST /api/mermaid/svg/` - Generate and download SVG file
- `GET /api/mermaid/health/` - Check Gemini AI service status

#### 🧪 Testing Endpoints (No Authentication)
- `POST /api/test/mermaid/` - Test flowchart generation with fallback
- `POST /api/test/svg/` - Test SVG generation with fallback
- `GET /api/demo/` - Interactive web interface for testing

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   uv sync
   ```

2. **Activate Virtual Environment**:
   ```bash
   source .venv/bin/activate
   ```

3. **Run Migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Create Superuser**:
   ```bash
   python manage.py createsuperuser
   ```

5. **Install Mermaid CLI (Optional for SVG generation)**:
   ```bash
   npm install -g @mermaid-js/mermaid-cli
   ```

6. **Start Development Server**:
   ```bash
   python manage.py runserver
   ```

## Configuration

### Environment Variables
Create a `.env` file with:
```
SECRET_KEY=your-secret-key
DEBUG=True
GEMINI_API_KEY=your-gemini-api-key
```

#### Getting a Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

### CORS Configuration
The API is configured to allow requests from:
- http://localhost:3000
- http://127.0.0.1:3000

### Authentication
The API uses Django's session authentication. Access the browsable API at:
- http://localhost:8000/api/auth/login/

## Visualization Types

The system supports the following visualization types:
- `timeline` - Story timeline visualization
- `character_map` - Character relationship mapping
- `plot_diagram` - Plot structure diagrams
- `mood_chart` - Mood and tone analysis charts
- `word_cloud` - Word frequency visualizations
- `flowchart` - **NEW**: AI-generated Mermaid flowcharts

## 🚀 Quick Start - Mermaid Flowcharts

### Test the Interactive Interface
1. Start the server: `python manage.py runserver`
2. Open your browser: `http://localhost:8000/api/demo/`
3. Enter a prompt and generate flowcharts instantly!

### Generate via API
```bash
# Generate flowchart from description
curl -X POST http://localhost:8000/api/test/mermaid/ \
  -H "Content-Type: application/json" \
  -d '{"description": "Create a user login workflow"}'

# Download as SVG
curl -X POST http://localhost:8000/api/test/svg/ \
  -H "Content-Type: application/json" \
  -d '{"description": "Create a user registration process"}' \
  -o flowchart.svg
```

### Example Prompts
- "Create a flowchart for user registration with email verification"
- "Design a workflow for e-commerce order processing"
- "Generate a bug report handling process flowchart"
- "Create a decision tree for customer support system"

## Technology Stack

- **Django 5.2** - Web framework
- **Django REST Framework** - API framework
- **django-cors-headers** - CORS handling
- **Google Gemini AI** - AI-powered flowchart generation
- **Mermaid.js** - Diagram generation and SVG export
- **SQLite** - Database (development)
- **Celery** - Background task processing (ready for integration)

## Development Notes

- All models use UUID primary keys for security
- User-scoped data access with proper permissions
- Async-ready architecture for background processing
- Full CRUD operations for all resources
- Browsable API interface for development

## 🔧 Mermaid Integration Architecture

### Service Layer
- `MermaidService` - Core service for Gemini AI integration
- Automatic model selection and SSL handling
- Graceful fallback to template generation
- SVG rendering via Mermaid CLI

### Resilient Design
- **Fallback System**: Always generates flowcharts (AI or template)
- **Error Handling**: Detailed error reporting and recovery
- **SSL Compatibility**: Development-friendly SSL configuration
- **Testing Interface**: Browser-based testing and validation

### Production Considerations
- Set `GEMINI_API_KEY` in production environment
- Install Mermaid CLI for SVG generation
- Consider rate limiting for AI API calls
- Monitor API usage and costs