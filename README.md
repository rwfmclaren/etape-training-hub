# Etape Training Hub

A full-stack web application for tracking cycling training data, nutrition, workouts, and goals.

## Features

- **User Authentication**: Secure login and registration with JWT tokens
- **Role-Based Access Control (RBAC)**: Three user types (athlete, trainer, admin) with granular permissions
- **Trainer-Athlete Relationships**: Athletes can request trainers, trainers approve/manage relationships
- **Training Plans**: Trainers create comprehensive plans with workouts, goals, nutrition, and document uploads
- **Ride Tracking**: Log cycling rides with detailed metrics (distance, duration, speed, power, heart rate, cadence)
- **Workout Management**: Track off-bike training activities
- **Nutrition Logging**: Monitor daily nutrition and hydration
- **Goal Setting**: Create and track training goals
- **Admin Dashboard**: System-wide user management, role changes, account controls, statistics
- **Dashboard**: Visual overview of training progress

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Relational database
- **SQLAlchemy**: ORM for database operations
- **JWT**: Secure authentication
- **Alembic**: Database migrations

### Frontend
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **React Router**: Client-side routing
- **Axios**: HTTP client

### Deployment
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Frontend web server
- **Azure**: Cloud deployment ready

## Project Structure

```
etape-training-hub/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Configuration and security
│   │   ├── db/           # Database setup
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── main.py       # FastAPI application
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # React context (auth)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd etape-training-hub
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file with secure values:
   - Change `SECRET_KEY` to a random string (use `openssl rand -hex 32`)
   - Update database credentials if needed

4. Start the application:
```bash
docker-compose up -d
```

5. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Development Setup

### Backend Development

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run development server:
```bash
uvicorn app.main:app --reload
```

### Frontend Development

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Rides
- `GET /api/v1/rides/` - List all rides
- `POST /api/v1/rides/` - Create new ride
- `GET /api/v1/rides/{id}` - Get ride details
- `PUT /api/v1/rides/{id}` - Update ride
- `DELETE /api/v1/rides/{id}` - Delete ride

### Workouts
- `GET /api/v1/workouts/` - List all workouts
- `POST /api/v1/workouts/` - Create new workout
- `GET /api/v1/workouts/{id}` - Get workout details
- `PUT /api/v1/workouts/{id}` - Update workout
- `DELETE /api/v1/workouts/{id}` - Delete workout

### Nutrition
- `GET /api/v1/nutrition/` - List nutrition logs
- `POST /api/v1/nutrition/` - Create nutrition log
- `GET /api/v1/nutrition/{id}` - Get nutrition log details
- `PUT /api/v1/nutrition/{id}` - Update nutrition log
- `DELETE /api/v1/nutrition/{id}` - Delete nutrition log

### Goals
- `GET /api/v1/goals/` - List all goals
- `POST /api/v1/goals/` - Create new goal
- `GET /api/v1/goals/{id}` - Get goal details
- `PUT /api/v1/goals/{id}` - Update goal
- `DELETE /api/v1/goals/{id}` - Delete goal

### Trainer-Athlete Relationships
- `POST /api/v1/trainer-requests/` - Send trainer request
- `GET /api/v1/trainer-requests/` - Get trainer requests
- `PUT /api/v1/trainer-requests/{id}/respond` - Approve/reject request
- `GET /api/v1/trainer-requests/assignments` - Get assignments
- `DELETE /api/v1/trainer-requests/assignments/{id}` - End assignment
- `GET /api/v1/trainer-requests/trainers/search` - Search trainers
- `GET /api/v1/trainer-requests/my-athletes` - Get trainer's athletes

### Training Plans
- `GET /api/v1/training-plans/` - List training plans
- `POST /api/v1/training-plans/` - Create training plan (trainer only)
- `GET /api/v1/training-plans/{id}` - Get plan details
- `PUT /api/v1/training-plans/{id}` - Update plan
- `DELETE /api/v1/training-plans/{id}` - Delete plan
- `POST /api/v1/training-plans/{id}/workouts` - Add workout to plan
- `POST /api/v1/training-plans/{id}/goals` - Add goal to plan
- `POST /api/v1/training-plans/{id}/nutrition` - Add nutrition plan
- `POST /api/v1/training-plans/{id}/documents` - Upload document
- `GET /api/v1/training-plans/{id}/documents/{doc_id}` - Download document
- `DELETE /api/v1/training-plans/{id}/documents/{doc_id}` - Delete document

### Admin
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/users/{id}` - Get user details
- `PUT /api/v1/admin/users/{id}/role` - Change user role
- `PUT /api/v1/admin/users/{id}/lock` - Lock/unlock account
- `DELETE /api/v1/admin/users/{id}` - Delete user
- `GET /api/v1/admin/assignments` - View all assignments
- `POST /api/v1/admin/assignments` - Create assignment manually
- `DELETE /api/v1/admin/assignments/{id}` - End assignment
- `GET /api/v1/admin/stats` - Get system statistics

## Azure Deployment

The application is containerized and ready for Azure deployment:

1. **Azure Container Registry**: Push Docker images
2. **Azure Container Instances** or **Azure App Service**: Deploy containers
3. **Azure Database for PostgreSQL**: Managed database service

### Deployment Steps

1. Build and push images to Azure Container Registry:
```bash
docker build -t <registry>.azurecr.io/etape-backend:latest ./backend
docker build -t <registry>.azurecr.io/etape-frontend:latest ./frontend
docker push <registry>.azurecr.io/etape-backend:latest
docker push <registry>.azurecr.io/etape-frontend:latest
```

2. Create Azure resources and deploy containers
3. Configure environment variables in Azure
4. Set up Azure Database for PostgreSQL

## License

MIT License
