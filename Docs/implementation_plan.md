# IMPLEMENTATION PLAN

## Project Submission & Review Portal
**Full-Stack Web Application | Next.js + Python FastAPI + AWS**

---

## Overview

This document outlines the phased implementation plan for the Project Submission & Review Portal. The plan is structured into 8 phases, each building upon the previous one to ensure a systematic development approach.

**Estimated Total Duration:** 6-8 weeks (for an individual developer)

---

## Phase 1: Project Setup & Environment Configuration
**Duration:** 3-4 days

### 1.1 Repository Setup
- [ ] Create GitHub repository for the project
- [ ] Set up `.gitignore` for Python, Node.js, and environment files
- [ ] Create initial README.md with project overview
- [ ] Define branching strategy (main, develop, feature branches)

### 1.2 Project Structure
```
project-submission-portal/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # Utilities and API client
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript type definitions
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/             # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── projects.py
│   │   │   ├── files.py
│   │   │   └── users.py
│   │   ├── core/            # Core configurations
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── main.py          # Application entry point
│   ├── requirements.txt
│   ├── alembic/             # Database migrations
│   └── alembic.ini
├── Docs/                     # Project documentation
├── scripts/                  # Deployment and utility scripts
├── .env.example
└── docker-compose.yml        # Local development (optional)
```

### 1.3 Frontend Setup
- [ ] Initialize Next.js project with TypeScript
  ```bash
  npx create-next-app@latest frontend --typescript --tailwind --eslint --app
  ```
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint and Prettier
- [ ] Create base layout components
- [ ] Configure environment variables structure

### 1.4 Backend Setup
- [ ] Create Python virtual environment
  ```bash
  python -m venv venv
  source venv/bin/activate  # Linux/Mac
  ```
- [ ] Install core dependencies
  ```bash
  pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary python-jose passlib boto3 python-multipart
  ```
- [ ] Create `requirements.txt`
- [ ] Set up FastAPI application structure
- [ ] Configure environment variables

### 1.5 Local Development Environment
- [ ] Install PostgreSQL locally or use Docker
- [ ] Create development database
- [ ] Configure database connection
- [ ] Test basic FastAPI server startup
- [ ] Test Next.js development server

### Deliverables:
- Working local development environment
- Connected frontend and backend (basic health check)
- GitHub repository with initial commit

---

## Phase 2: Database Design & Backend Foundation
**Duration:** 4-5 days

### 2.1 Database Models
- [ ] Create SQLAlchemy Base configuration
- [ ] Implement User model
  ```python
  class User(Base):
      __tablename__ = "users"
      id = Column(UUID, primary_key=True, default=uuid4)
      name = Column(String(100), nullable=False)
      email = Column(String(255), unique=True, nullable=False)
      password_hash = Column(String(255), nullable=False)
      is_active = Column(Boolean, default=True)
      created_at = Column(DateTime, default=datetime.utcnow)
  ```
- [ ] Implement Project model
  ```python
  class Project(Base):
      __tablename__ = "projects"
      id = Column(UUID, primary_key=True, default=uuid4)
      user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
      title = Column(String(200), nullable=False)
      description = Column(Text)
      category = Column(String(100))
      technologies = Column(ARRAY(String))
      github_url = Column(String(500))
      demo_url = Column(String(500))
      status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)
      review_comment = Column(Text)
      created_at = Column(DateTime, default=datetime.utcnow)
      updated_at = Column(DateTime, onupdate=datetime.utcnow)
  ```
- [ ] Implement ProjectFile model
  ```python
  class ProjectFile(Base):
      __tablename__ = "project_files"
      id = Column(UUID, primary_key=True, default=uuid4)
      project_id = Column(UUID, ForeignKey("projects.id"), nullable=False)
      file_name = Column(String(255), nullable=False)
      file_type = Column(String(50))
      s3_key = Column(String(500), nullable=False)
      file_size = Column(Integer)
      created_at = Column(DateTime, default=datetime.utcnow)
  ```

### 2.2 Database Migrations
- [ ] Initialize Alembic
  ```bash
  alembic init alembic
  ```
- [ ] Configure Alembic with SQLAlchemy models
- [ ] Create initial migration
- [ ] Apply migration to development database

### 2.3 Pydantic Schemas
- [ ] Create User schemas (UserCreate, UserResponse, UserLogin)
- [ ] Create Project schemas (ProjectCreate, ProjectUpdate, ProjectResponse)
- [ ] Create File schemas (FileUpload, FileResponse)
- [ ] Create Token schemas (Token, TokenData)

### 2.4 Core Configuration
- [ ] Implement config.py with Pydantic Settings
  ```python
  class Settings(BaseSettings):
      DATABASE_URL: str
      SECRET_KEY: str
      ALGORITHM: str = "HS256"
      ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
      AWS_ACCESS_KEY_ID: str
      AWS_SECRET_ACCESS_KEY: str
      AWS_S3_BUCKET: str
      AWS_REGION: str = "us-east-1"
      
      class Config:
          env_file = ".env"
  ```
- [ ] Set up database session management
- [ ] Create dependency injection for database sessions

### Deliverables:
- Complete database schema
- Working migrations
- Pydantic schemas for all entities
- Core configuration module

---

## Phase 3: Authentication System
**Duration:** 4-5 days

### 3.1 Backend Authentication
- [ ] Implement password hashing utilities
  ```python
  from passlib.context import CryptContext
  pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
  ```
- [ ] Implement JWT token generation and validation
- [ ] Create authentication dependencies
  ```python
  async def get_current_user(token: str = Depends(oauth2_scheme)):
      # Validate token and return user
  ```

### 3.2 Auth API Endpoints
- [ ] POST `/auth/register` - User registration
  - Validate email uniqueness
  - Hash password
  - Create user record
  - Return user info (exclude password)
- [ ] POST `/auth/login` - User login
  - Validate credentials
  - Generate JWT token
  - Return access token
- [ ] GET `/users/me` - Get current user
  - Protected route
  - Return authenticated user info

### 3.3 Frontend Authentication
- [ ] Create authentication context/provider
- [ ] Implement login page (`/login`)
  - Email and password form
  - Form validation
  - Error handling
  - Redirect on success
- [ ] Implement registration page (`/register`)
  - Name, email, password fields
  - Password confirmation
  - Form validation
  - Success message and redirect
- [ ] Create protected route wrapper/middleware
- [ ] Implement logout functionality
- [ ] Store token in localStorage/cookies
- [ ] Create API client with token interceptor

### 3.4 Authentication UI Components
- [ ] Login form component
- [ ] Register form component
- [ ] Auth navigation (Login/Logout buttons)
- [ ] Loading states for auth operations

### Deliverables:
- Working user registration
- Working user login with JWT
- Protected routes on frontend
- Authentication state management

---

## Phase 4: Project Management (CRUD)
**Duration:** 5-6 days

### 4.1 Backend Project APIs
- [ ] GET `/projects` - List user's projects
  - Filter by authenticated user
  - Pagination support
  - Optional status filter
- [ ] POST `/projects` - Create new project
  - Validate input
  - Associate with current user
  - Set initial status as DRAFT
- [ ] GET `/projects/{project_id}` - Get project details
  - Verify ownership
  - Include related files
- [ ] PUT `/projects/{project_id}` - Update project
  - Verify ownership
  - Validate status transitions
  - Update timestamp
- [ ] DELETE `/projects/{project_id}` - Delete project
  - Verify ownership
  - Delete associated files from S3
  - Cascade delete file records

### 4.2 Project Service Layer
- [ ] Create ProjectService class
  ```python
  class ProjectService:
      def create_project(self, db, user_id, project_data):
          pass
      def get_user_projects(self, db, user_id):
          pass
      def get_project(self, db, project_id, user_id):
          pass
      def update_project(self, db, project_id, user_id, update_data):
          pass
      def delete_project(self, db, project_id, user_id):
          pass
  ```

### 4.3 Frontend Dashboard
- [ ] Create dashboard layout (`/dashboard`)
- [ ] Projects list component
  - Display project cards
  - Show status badges
  - Action buttons (view, edit, delete)
- [ ] Empty state for no projects
- [ ] Loading skeleton

### 4.4 Project Forms
- [ ] Create project form (`/dashboard/projects/new`)
  - Title (required)
  - Description (textarea)
  - Category (dropdown)
  - Technologies (multi-select or tags)
  - GitHub URL
  - Demo URL
  - Form validation
- [ ] Edit project form (`/dashboard/projects/[id]/edit`)
  - Pre-populate with existing data
  - Same fields as create
- [ ] Project detail page (`/dashboard/projects/[id]`)
  - Display all project information
  - Show current status
  - List uploaded files
  - Edit and delete buttons

### 4.5 Frontend API Integration
- [ ] Create projects API client
  ```typescript
  export const projectsApi = {
    list: () => api.get('/projects'),
    create: (data: ProjectCreate) => api.post('/projects', data),
    get: (id: string) => api.get(`/projects/${id}`),
    update: (id: string, data: ProjectUpdate) => api.put(`/projects/${id}`, data),
    delete: (id: string) => api.delete(`/projects/${id}`),
  };
  ```

### Deliverables:
- Complete project CRUD functionality
- Dashboard with project listing
- Project creation and editing forms
- Project detail view

---

## Phase 5: File Management & S3 Integration
**Duration:** 5-6 days

### 5.1 AWS S3 Setup
- [ ] Create S3 bucket for file storage
- [ ] Configure bucket policies
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {"AWS": "arn:aws:iam::ACCOUNT:user/app-user"},
        "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
        "Resource": "arn:aws:s3:::bucket-name/*"
      }
    ]
  }
  ```
- [ ] Create IAM user with S3 permissions
- [ ] Generate access keys
- [ ] Configure CORS for bucket (if needed for direct uploads)

### 5.2 Backend S3 Service
- [ ] Create S3 service class
  ```python
  class S3Service:
      def __init__(self):
          self.s3_client = boto3.client('s3', ...)
          
      def upload_file(self, file, project_id):
          key = f"projects/{project_id}/{uuid4()}_{file.filename}"
          self.s3_client.upload_fileobj(file.file, bucket, key)
          return key
          
      def delete_file(self, s3_key):
          self.s3_client.delete_object(Bucket=bucket, Key=s3_key)
          
      def get_presigned_url(self, s3_key, expiration=3600):
          return self.s3_client.generate_presigned_url(...)
  ```

### 5.3 File API Endpoints
- [ ] POST `/projects/{project_id}/files` - Upload file
  - Accept multipart form data
  - Validate file type and size
  - Upload to S3
  - Create file record in database
- [ ] GET `/projects/{project_id}/files` - List project files
  - Return file metadata
  - Include presigned URLs for access
- [ ] DELETE `/files/{file_id}` - Delete file
  - Verify project ownership
  - Delete from S3
  - Delete database record
- [ ] GET `/files/{file_id}/download` - Get download URL
  - Generate presigned URL
  - Return redirect or URL

### 5.4 Frontend File Upload
- [ ] Create file upload component
  - Drag and drop zone
  - File type validation
  - Progress indicator
  - Multiple file support
- [ ] Integrate with project detail page
- [ ] Display uploaded files
  - File name and type icon
  - File size
  - Upload date
  - Download and delete buttons
- [ ] Implement file preview (images)

### 5.5 File Type Handling
- [ ] Define allowed file types
  ```python
  ALLOWED_FILE_TYPES = {
      'image/png', 'image/jpeg', 'image/gif',
      'application/pdf',
      'application/zip', 'application/x-zip-compressed',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
  ```
- [ ] Set maximum file size (e.g., 50MB)
- [ ] Implement file type validation on both frontend and backend

### Deliverables:
- Working S3 integration
- File upload functionality
- File listing and download
- File deletion

---

## Phase 6: Project Review & Status Management
**Duration:** 3-4 days

### 6.1 Status Workflow
- [ ] Define status enum
  ```python
  class ProjectStatus(str, Enum):
      DRAFT = "draft"
      SUBMITTED = "submitted"
      UNDER_REVIEW = "under_review"
      APPROVED = "approved"
      CHANGES_REQUESTED = "changes_requested"
  ```
- [ ] Define valid status transitions
  ```python
  VALID_TRANSITIONS = {
      ProjectStatus.DRAFT: [ProjectStatus.SUBMITTED],
      ProjectStatus.SUBMITTED: [ProjectStatus.UNDER_REVIEW, ProjectStatus.DRAFT],
      ProjectStatus.UNDER_REVIEW: [ProjectStatus.APPROVED, ProjectStatus.CHANGES_REQUESTED],
      ProjectStatus.APPROVED: [],
      ProjectStatus.CHANGES_REQUESTED: [ProjectStatus.SUBMITTED],
  }
  ```

### 6.2 Backend Review APIs
- [ ] POST `/projects/{project_id}/submit` - Submit for review
  - Validate project has required fields
  - Change status to SUBMITTED
  - Record submission timestamp
- [ ] POST `/projects/{project_id}/review` - Add review (reviewer only)
  - Accept status and comment
  - Validate status transition
  - Update project status
  - Store review comment

### 6.3 Frontend Status Display
- [ ] Create status badge component
  ```typescript
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    changes_requested: 'bg-red-100 text-red-800',
  };
  ```
- [ ] Add status to project cards
- [ ] Add status to project detail page

### 6.4 Submit & Review UI
- [ ] Submit button on project detail page
  - Show only for DRAFT or CHANGES_REQUESTED
  - Confirmation dialog
- [ ] Display review comment on project detail
- [ ] (Optional) Simple review interface for reviewers

### Deliverables:
- Complete status workflow
- Submit for review functionality
- Review comment display
- Status badges and indicators

---

## Phase 7: UI Polish & Frontend Completion
**Duration:** 4-5 days

### 7.1 Layout & Navigation
- [ ] Create main application layout
  - Header with navigation
  - User menu (profile, logout)
  - Sidebar for dashboard (optional)
  - Footer
- [ ] Implement responsive design
- [ ] Add mobile navigation

### 7.2 Landing Page
- [ ] Create public landing page (`/`)
  - Hero section
  - Features overview
  - Call to action (Register/Login)
- [ ] About page (optional)

### 7.3 UI Components Library
- [ ] Button component (variants: primary, secondary, danger)
- [ ] Input component with validation states
- [ ] Select/Dropdown component
- [ ] Modal/Dialog component
- [ ] Toast/Notification component
- [ ] Loading spinner
- [ ] Empty state component
- [ ] Error boundary

### 7.4 Form Improvements
- [ ] Add form validation feedback
- [ ] Implement loading states on submit
- [ ] Add success/error notifications
- [ ] Improve accessibility (labels, ARIA)

### 7.5 Dashboard Enhancements
- [ ] Add project filtering (by status)
- [ ] Add project sorting (date, title)
- [ ] Implement pagination or infinite scroll
- [ ] Add search functionality (optional)

### 7.6 Error Handling
- [ ] Create error pages (404, 500)
- [ ] Implement global error handling
- [ ] Add user-friendly error messages
- [ ] Handle network errors gracefully

### Deliverables:
- Polished, responsive UI
- Complete component library
- Error handling throughout
- Accessible interface

---

## Phase 8: Deployment & CI/CD
**Duration:** 5-7 days

### 8.1 AWS Infrastructure Setup
- [ ] Launch EC2 instance (Ubuntu recommended)
  - Instance type: t2.micro or t2.small
  - Security groups: Allow HTTP (80), HTTPS (443), SSH (22)
- [ ] Allocate and associate Elastic IP
- [ ] Set up domain name (optional)
- [ ] Configure SSL certificate (Let's Encrypt)

### 8.2 Server Configuration
- [ ] Install required packages
  ```bash
  sudo apt update
  sudo apt install python3 python3-pip python3-venv nodejs npm nginx postgresql
  ```
- [ ] Configure PostgreSQL database
- [ ] Set up environment variables
- [ ] Configure Nginx as reverse proxy
  ```nginx
  server {
      listen 80;
      server_name your-domain.com;
      
      location /api {
          proxy_pass http://127.0.0.1:8000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
      
      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
  }
  ```

### 8.3 Application Deployment
- [ ] Clone repository on server
- [ ] Set up Python virtual environment
- [ ] Install Python dependencies
- [ ] Run database migrations
- [ ] Build Next.js application
- [ ] Configure process managers (systemd or PM2)
  ```bash
  # Backend service
  [Unit]
  Description=FastAPI Backend
  After=network.target
  
  [Service]
  User=ubuntu
  WorkingDirectory=/home/ubuntu/app/backend
  ExecStart=/home/ubuntu/app/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
  Restart=always
  
  [Install]
  WantedBy=multi-user.target
  ```

### 8.4 AWS CodeBuild Setup
- [ ] Create buildspec.yml
  ```yaml
  version: 0.2
  phases:
    install:
      runtime-versions:
        python: 3.11
        nodejs: 18
      commands:
        - cd backend && pip install -r requirements.txt
        - cd frontend && npm install
    build:
      commands:
        - cd frontend && npm run build
    post_build:
      commands:
        - echo "Deploying to EC2..."
        # Add deployment commands
  artifacts:
    files:
      - '**/*'
  ```
- [ ] Create CodeBuild project in AWS Console
- [ ] Connect GitHub repository
- [ ] Configure build triggers (on push to main)
- [ ] Set up deployment to EC2 (CodeDeploy or scripts)

### 8.5 CI/CD Pipeline
- [ ] Create deployment scripts
  ```bash
  #!/bin/bash
  # deploy.sh
  cd /home/ubuntu/app
  git pull origin main
  
  # Backend
  cd backend
  source venv/bin/activate
  pip install -r requirements.txt
  alembic upgrade head
  sudo systemctl restart backend
  
  # Frontend
  cd ../frontend
  npm install
  npm run build
  pm2 restart frontend
  ```
- [ ] Configure webhook or scheduled builds
- [ ] Test complete CI/CD pipeline

### 8.6 Monitoring & Logging
- [ ] Set up application logging
- [ ] Configure log rotation
- [ ] Set up basic monitoring (CloudWatch or simple scripts)
- [ ] Create health check endpoint

### Deliverables:
- Production deployment on EC2
- Working CI/CD pipeline
- SSL/HTTPS configured
- Monitoring and logging

---

## Testing Checklist

### Authentication Tests
- [ ] User registration with valid data
- [ ] User registration with duplicate email
- [ ] User login with correct credentials
- [ ] User login with incorrect credentials
- [ ] Protected route access without token
- [ ] Protected route access with valid token

### Project Management Tests
- [ ] Create project
- [ ] List user's projects
- [ ] View project details
- [ ] Update project
- [ ] Delete project
- [ ] Access other user's project (should fail)

### File Management Tests
- [ ] Upload valid file types
- [ ] Upload invalid file types (should fail)
- [ ] Upload file exceeding size limit (should fail)
- [ ] List project files
- [ ] Download file
- [ ] Delete file

### Status Workflow Tests
- [ ] Submit draft project
- [ ] Submit already submitted project (should fail)
- [ ] Review submitted project
- [ ] Resubmit after changes requested

---

## Environment Variables Reference

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/project_portal

# JWT
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Application
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| S3 credentials exposure | High | Use environment variables, never commit to Git |
| JWT token theft | High | Use HTTPS, implement token refresh, short expiration |
| SQL injection | High | Use SQLAlchemy ORM, parameterized queries |
| Large file uploads | Medium | Set file size limits, validate on server |
| CORS issues | Medium | Configure proper CORS headers |
| Database connection issues | Medium | Implement connection pooling, retries |

---

## Success Criteria

### Version 1 Complete When:
1. User can register and login
2. User can create, view, edit, and delete projects
3. User can upload and manage files (stored in S3)
4. User can submit project for review
5. Project status is visible and manageable
6. Application is deployed on EC2
7. CI/CD pipeline deploys on push to main

---

## Post-Launch Tasks

- [ ] Gather user feedback
- [ ] Monitor application performance
- [ ] Review and optimize database queries
- [ ] Document API endpoints (Swagger/OpenAPI)
- [ ] Plan Version 2 features

---

*Implementation Plan Version: 1.0*  
*Last Updated: September 2026*
