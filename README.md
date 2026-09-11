# Project Submission & Review Portal

A full-stack web application for managing and reviewing software project submissions. Built with Next.js, FastAPI, PostgreSQL, and AWS S3.

## Overview

The Project Submission & Review Portal provides a centralized platform where users can:
- Create and manage software projects
- Upload project files (screenshots, reports, source code)
- Submit projects for review
- Track submission status and receive feedback

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | Python, FastAPI |
| **Database** | PostgreSQL |
| **Object Storage** | Amazon S3 |
| **Authentication** | JWT |
| **Hosting** | Amazon EC2 |
| **CI/CD** | GitHub + AWS CodeBuild |

## Project Structure

```
project-submission-portal/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # Utilities and API client
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/             # API route handlers
│   │   ├── core/            # Core configurations
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic
│   ├── alembic/             # Database migrations
│   └── requirements.txt
├── Docs/                     # Project documentation
├── scripts/                  # Deployment scripts
└── .env.example             # Environment template
```

## Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **PostgreSQL** >= 14
- **AWS Account** (for S3 storage)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Project Submission and Review Portal"
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# - Database connection string
# - JWT secret key
# - AWS credentials
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Linux/Mac:
source venv/bin/activate
# Windows:
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Run database migrations (after Phase 2)
# alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
# Edit .env.local if needed

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 5. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE project_portal;
\q

# Run migrations (after Phase 2)
cd backend
alembic upgrade head
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | User login |
| GET | `/users/me` | Get current user info |
| GET | `/projects` | List user's projects |
| POST | `/projects` | Create a new project |
| GET | `/projects/{id}` | Get project details |
| PUT | `/projects/{id}` | Update a project |
| DELETE | `/projects/{id}` | Delete a project |
| POST | `/projects/{id}/files` | Upload files |
| GET | `/projects/{id}/files` | List project files |
| DELETE | `/files/{id}` | Delete a file |
| POST | `/projects/{id}/submit` | Submit for review |
| POST | `/projects/{id}/review` | Add review |

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Formatting

```bash
# Backend
cd backend
black .
isort .

# Frontend
cd frontend
npm run lint
```

## Deployment

See [Docs/implementation_plan.md](Docs/implementation_plan.md) for detailed deployment instructions.

### Quick Deployment Steps

1. Set up EC2 instance with Ubuntu
2. Install Nginx, PostgreSQL, Node.js, Python
3. Clone repository and configure environment
4. Set up systemd services for backend
5. Build and serve frontend with PM2
6. Configure Nginx reverse proxy
7. Set up SSL with Let's Encrypt
8. Configure AWS CodeBuild for CI/CD

## Documentation

- [Problem Statement](Docs/problem_statement.md)
- [Implementation Plan](Docs/implementation_plan.md)

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This project is for educational purposes.

---

**Version:** 1.0.0  
**Last Updated:** September 2026
