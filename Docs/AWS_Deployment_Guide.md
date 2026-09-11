# AWS Deployment Guide - Project Submission & Review Portal

This guide documents the complete CI/CD pipeline setup for deploying a full-stack application (Next.js frontend + FastAPI backend) to AWS EC2 using CodePipeline, ECR, and SSM.

---

## Project Overview

**Project Submission & Review Portal** is a full-stack web application that allows users to submit projects for review and receive feedback from reviewers.

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 (App Router) | React framework with SSR |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Backend** | FastAPI (Python) | High-performance REST API |
| **Database** | PostgreSQL | Relational database |
| **ORM** | SQLAlchemy | Database abstraction |
| **Migrations** | Alembic | Database schema versioning |
| **Auth** | JWT + httpOnly Cookies | Secure authentication |
| **Container** | Docker | Containerization |
| **Process Manager** | Supervisor | Run multiple services |
| **CI/CD** | AWS CodePipeline | Automated deployment |

---

## Project Structure

```
Project Submission and Review Portal/
├── frontend/                    # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                # Next.js 14 App Router (pages)
│   │   │   ├── login/          # Login page
│   │   │   ├── register/       # Registration page
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── projects/       # Project management
│   │   │   │   ├── [id]/       # Dynamic project detail
│   │   │   │   └── new/        # Create new project
│   │   │   ├── review/         # Review section
│   │   │   ├── profile/        # User profile
│   │   │   ├── layout.tsx      # Root layout
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── error.tsx       # Error boundary
│   │   │   ├── loading.tsx     # Loading state
│   │   │   └── globals.css     # Global styles
│   │   │
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React Context providers
│   │   │   └── AuthContext.tsx # Authentication state
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility libraries
│   │   │   └── axios.ts        # Axios instance with interceptors
│   │   ├── services/           # API service functions
│   │   │   ├── authService.ts  # Authentication API calls
│   │   │   └── fileService.ts  # File upload API calls
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Helper functions
│   │       └── api-method.ts   # Generic API caller
│   │
│   ├── public/                 # Static assets
│   ├── package.json            # Dependencies
│   ├── next.config.mjs         # Next.js configuration
│   ├── tailwind.config.ts      # Tailwind configuration
│   └── tsconfig.json           # TypeScript configuration
│
├── backend/                    # FastAPI Backend Application
│   ├── app/
│   │   ├── api/                # API route handlers
│   │   │   ├── __init__.py     # Router aggregation
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── users.py        # User management endpoints
│   │   │   ├── projects.py     # Project CRUD endpoints
│   │   │   └── files.py        # File upload endpoints
│   │   │
│   │   ├── core/               # Core configuration
│   │   │   ├── config.py       # Settings (env vars)
│   │   │   ├── database.py     # Database connection
│   │   │   ├── deps.py         # Dependency injection
│   │   │   └── security.py     # JWT & password hashing
│   │   │
│   │   ├── models/             # SQLAlchemy ORM models
│   │   │   ├── user.py         # User model
│   │   │   ├── project.py      # Project model
│   │   │   ├── file.py         # ProjectFile model
│   │   │   └── refresh_token.py # RefreshToken model
│   │   │
│   │   ├── schemas/            # Pydantic schemas (DTOs)
│   │   │   ├── user.py         # User request/response schemas
│   │   │   └── project.py      # Project schemas
│   │   │
│   │   ├── services/           # Business logic layer
│   │   └── main.py             # FastAPI app entry point
│   │
│   ├── alembic/                # Database migrations
│   │   └── versions/           # Migration files
│   ├── alembic.ini             # Alembic configuration
│   └── requirements.txt        # Python dependencies
│
├── Docs/                       # Documentation
│   └── AWS_Deployment_Guide.md # This file
│
├── Dockerfile                  # Multi-stage Docker build
├── supervisord.conf            # Process manager config
├── buildspec.yml               # AWS CodeBuild spec
├── docker-compose.yml          # Local development
└── .env.example                # Environment template
```

---

## Frontend Architecture (Next.js - The Ideal Way)

### App Router Structure (Next.js 14+)

Next.js 14 uses the **App Router** with file-system based routing:

```
src/app/
├── page.tsx          → Route: /
├── layout.tsx        → Wraps all pages (providers, navbar)
├── login/
│   └── page.tsx      → Route: /login
├── projects/
│   ├── page.tsx      → Route: /projects
│   ├── new/
│   │   └── page.tsx  → Route: /projects/new
│   └── [id]/
│       ├── page.tsx  → Route: /projects/123 (dynamic)
│       └── edit/
│           └── page.tsx → Route: /projects/123/edit
```

### Layered Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                      PAGES (app/)                       │
│  - Route components                                     │
│  - Use hooks and context                                │
│  - Call services for data                               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   CONTEXT (context/)                    │
│  - Global state (AuthContext)                           │
│  - Wraps app with providers                             │
│  - Manages user session                                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  SERVICES (services/)                   │
│  - API call functions                                   │
│  - Business logic                                       │
│  - Transform data                                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     LIB (lib/)                          │
│  - Axios instance with interceptors                     │
│  - Configured with baseURL, credentials                 │
│  - Auto token refresh on 401                            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND API                           │
└─────────────────────────────────────────────────────────┘
```

### Frontend File Organization (The Ideal Way)

```
src/
├── app/              # Pages (routes) - UI only, no business logic
├── components/       # Reusable UI components
├── context/          # Global state (React Context)
├── hooks/            # Custom React hooks
├── services/         # API call functions (business logic)
├── lib/              # Core utilities (axios instance)
├── utils/            # Helper functions
└── types/            # TypeScript definitions
```

**Why separate these?**

| Folder | Responsibility | Example |
|--------|---------------|---------|
| `app/` | Display UI, handle user events | Login form, button clicks |
| `services/` | Make API calls, transform data | `authService.login()` |
| `lib/` | Configure tools (axios, etc.) | Base URL, interceptors |
| `context/` | Share state across components | User auth state |
| `utils/` | Generic helper functions | Format dates, validate emails |
| `types/` | TypeScript interfaces | `User`, `Project` types |

---

### Key Frontend Patterns

#### 1. Axios Instance with Interceptors (`lib/axios.ts`)

```typescript
// Single source of truth for API client
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // Essential for cookies
  timeout: 30000,
});

// Auto-refresh token on 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Try to refresh token
      await axiosInstance.post("/auth/refresh");
      // Retry original request
      return axiosInstance(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

**Why this pattern?**
- Centralized configuration
- Automatic token refresh
- Consistent error handling
- No need to manage tokens in localStorage (more secure)

#### 2. Service Layer Pattern (`services/authService.ts`)

```typescript
// Services encapsulate API calls
export const login = async (credentials: UserLogin): Promise<void> => {
  const formData = new URLSearchParams();
  formData.append("username", credentials.email);
  formData.append("password", credentials.password);

  await axiosInstance.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const getCurrentUser = async (): Promise<User> => {
  return apiMethod<User>("/auth/me", "get");
};
```

**Why this pattern?**
- Pages don't know about API details
- Easy to test (mock services)
- Single place to change endpoint logic

#### How All Layers Connect (Complete Flow)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE DATA FLOW EXAMPLE                           │
│                           (User clicks "Login")                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. PAGE (app/login/page.tsx)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ const { login } = useAuth();  // Get login function from context        │
   │                                                                         │
   │ const handleSubmit = async () => {                                      │
   │   await login({ email, password });  // Call context method             │
   │   router.push("/dashboard");                                            │
   │ };                                                                      │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
2. CONTEXT (context/AuthContext.tsx)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ const login = async (credentials: UserLogin) => {                       │
   │   await authService.login(credentials);  // Call service                │
   │   const user = await authService.getCurrentUser();                      │
   │   setUser(user);  // Update global state                                │
   │ };                                                                      │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
3. SERVICE (services/authService.ts)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ export const login = async (credentials: UserLogin) => {                │
   │   const formData = new URLSearchParams();                               │
   │   formData.append("username", credentials.email);                       │
   │   formData.append("password", credentials.password);                    │
   │                                                                         │
   │   await axiosInstance.post("/auth/login", formData);  // Use axios      │
   │ };                                                                      │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
4. LIB (lib/axios.ts)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ const axiosInstance = axios.create({                                    │
   │   baseURL: process.env.NEXT_PUBLIC_API_URL,  // http://13.235.71.134    │
   │   withCredentials: true,  // Send cookies                               │
   │ });                                                                     │
   │                                                                         │
   │ // Interceptor handles token refresh automatically                      │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
5. BACKEND API
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ POST http://13.235.71.134:8000/auth/login                               │
   │ Response: Sets httpOnly cookies                                         │
   └─────────────────────────────────────────────────────────────────────────┘
```

**Benefits of this separation:**

| Layer | Benefit |
|-------|---------|
| **Page** | Only handles UI, easy to understand |
| **Context** | Login logic in one place, reusable |
| **Service** | API details hidden, easy to change |
| **Lib** | Token refresh automatic, consistent config |

**If API endpoint changes:**
- Only change `services/authService.ts`
- Pages and context don't need changes!

**If auth logic changes:**
- Only change `context/AuthContext.tsx`
- Pages just call `login()` - same interface!

#### 3. Context Pattern for Global State (`context/AuthContext.tsx`)

```typescript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    authService.checkAuth().then(setUser);
  }, []);

  const login = async (credentials) => {
    await authService.login(credentials);
    const user = await authService.getCurrentUser();
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Why this pattern?**
- User state accessible anywhere via `useAuth()` hook
- Login/logout logic in one place
- Components stay simple

#### 4. Generic API Method (`utils/api-method.ts`)

```typescript
export const apiMethod = async <T>(url: string, method: Method, data?: any): Promise<T> => {
  const response = await axiosInstance({ url, method, data });
  return response.data;
};

// Usage
const user = await apiMethod<User>("/users/1", "get");
const project = await apiMethod<Project>("/projects", "post", projectData);
```

**Why this pattern?**
- Type-safe API calls
- Consistent request/response handling
- Reduces boilerplate

---

## Backend Architecture (FastAPI - The Ideal Way)

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   API ROUTES (api/)                     │
│  - HTTP endpoints                                       │
│  - Request validation (Pydantic)                        │
│  - Call dependencies and services                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                DEPENDENCIES (core/deps.py)              │
│  - get_db() - Database session                          │
│  - get_current_user() - Auth validation                 │
│  - Dependency injection                                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  MODELS (models/)                       │
│  - SQLAlchemy ORM models                                │
│  - Database table definitions                           │
│  - Relationships                                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 SCHEMAS (schemas/)                      │
│  - Pydantic models for validation                       │
│  - Request/Response DTOs                                │
│  - Serialization                                        │
└─────────────────────────────────────────────────────────┘
```

### Key Backend Patterns

#### 1. Pydantic Settings for Configuration (`core/config.py`)

```python
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://..."
    SECRET_KEY: str = "change-me"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = get_settings()  # Cached singleton
```

**Why?**
- Environment variables automatically loaded
- Type validation on startup
- Easy to override for different environments

#### 2. Dependency Injection (`core/deps.py`)

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    db: Session = Depends(get_db),
    access_token: str = Cookie(None)
) -> User:
    # Validate JWT, get user from DB
    return user

# Usage in routes
@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return user
```

**Why?**
- Automatic cleanup (db sessions)
- Testable (mock dependencies)
- Declarative authentication

#### 3. httpOnly Cookie Authentication

```python
def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,      # JavaScript can't access
        secure=True,        # HTTPS only in production
        samesite="lax",     # CSRF protection
        max_age=900,        # 15 minutes
    )
```

**Why httpOnly cookies instead of localStorage?**
- XSS attacks can't steal tokens
- Automatically sent with requests
- More secure for sensitive apps

#### 4. CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://13.235.71.134"],  # Explicit origins
    allow_credentials=True,   # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Important:** Cannot use `allow_origins=["*"]` with `allow_credentials=True`

---

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           LOGIN FLOW                                      │
└──────────────────────────────────────────────────────────────────────────┘

1. User enters email/password on /login page

2. Frontend calls: POST /auth/login (form data)
   ┌─────────────────────────────────────────────────────────────────────┐
   │ const formData = new URLSearchParams();                             │
   │ formData.append("username", email);                                 │
   │ formData.append("password", password);                              │
   │ await axios.post("/auth/login", formData, { withCredentials: true })│
   └─────────────────────────────────────────────────────────────────────┘

3. Backend validates credentials, creates JWT tokens
   ┌─────────────────────────────────────────────────────────────────────┐
   │ access_token = create_access_token({"sub": user.id})  # 15 min      │
   │ refresh_token = create_refresh_token()                 # 7 days     │
   └─────────────────────────────────────────────────────────────────────┘

4. Backend sets httpOnly cookies in response
   ┌─────────────────────────────────────────────────────────────────────┐
   │ Set-Cookie: access_token=eyJ...; HttpOnly; Path=/                   │
   │ Set-Cookie: refresh_token=abc...; HttpOnly; Path=/auth              │
   └─────────────────────────────────────────────────────────────────────┘

5. Frontend calls: GET /auth/me to get user data
   - Cookie automatically sent by browser
   - Backend validates token, returns user

6. AuthContext stores user, sets isAuthenticated=true

7. User redirected to /dashboard


┌──────────────────────────────────────────────────────────────────────────┐
│                       TOKEN REFRESH FLOW                                  │
└──────────────────────────────────────────────────────────────────────────┘

1. User makes API request with expired access_token

2. Backend returns 401 Unauthorized

3. Axios interceptor catches 401:
   ┌─────────────────────────────────────────────────────────────────────┐
   │ if (error.response.status === 401 && !originalRequest._retry) {    │
   │   originalRequest._retry = true;                                    │
   │   await axios.post("/auth/refresh");  // Uses refresh_token cookie  │
   │   return axios(originalRequest);      // Retry with new token       │
   │ }                                                                   │
   └─────────────────────────────────────────────────────────────────────┘

4. Backend validates refresh_token, issues new access_token

5. Original request succeeds with new token

6. User doesn't notice anything (seamless)
```

---

## Docker Multi-Stage Build

The Dockerfile uses multi-stage builds for efficiency:

```dockerfile
# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
ARG NEXT_PUBLIC_API_URL           # Build-time variable
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci                         # Install dependencies
COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build                  # Create production build

# Stage 2: Final image
FROM python:3.11-slim
# Install Node.js for Next.js runtime
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs supervisor

# Copy Python dependencies
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build from Stage 1
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Run both services with supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

**Why multi-stage?**
- Final image doesn't include build tools (smaller)
- Frontend is pre-built, not building at runtime
- Single image runs both frontend and backend

---

## Environment Variables

### Build-time vs Runtime Variables

| Type | When Used | Example |
|------|-----------|---------|
| **Build-time** | During `docker build` | `NEXT_PUBLIC_API_URL` (baked into JS) |
| **Runtime** | When container starts | `DATABASE_URL`, `SECRET_KEY` |

### Frontend (Next.js)

Variables must be prefixed with `NEXT_PUBLIC_` to be available in browser:

```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production - passed during build
docker build --build-arg NEXT_PUBLIC_API_URL=http://13.235.71.134:8000 .
```

### Backend (FastAPI)

```bash
# .env (development)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/project_portal
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://13.235.71.134

# Production - passed to container
docker run -e DATABASE_URL=postgresql://... -e SECRET_KEY=... app
```

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [AWS Services Used](#aws-services-used)
3. [Prerequisites](#prerequisites)
4. [Step 1: ECR Repository Setup](#step-1-ecr-repository-setup)
5. [Step 2: EC2 Instance Setup](#step-2-ec2-instance-setup)
6. [Step 3: IAM Roles Configuration](#step-3-iam-roles-configuration)
7. [Step 4: Secrets Manager Setup](#step-4-secrets-manager-setup)
8. [Step 5: CodeBuild Project Setup](#step-5-codebuild-project-setup)
9. [Step 6: CodePipeline Setup](#step-6-codepipeline-setup)
10. [Step 7: Database Setup on EC2](#step-7-database-setup-on-ec2)
11. [Step 8: Buildspec Configuration](#step-8-buildspec-configuration)
12. [How the Pipeline Works](#how-the-pipeline-works)
13. [Troubleshooting](#troubleshooting)
14. [Useful Commands](#useful-commands)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                       │
│                                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌─────────┐    ┌─────────────────────┐│
│  │  GitHub  │───▶│ CodePipeline │───▶│CodeBuild│───▶│        ECR          ││
│  │   (dev)  │    │              │    │         │    │  (Docker Images)    ││
│  └──────────┘    └──────────────┘    └────┬────┘    └─────────────────────┘│
│                                           │                                 │
│                                           │ SSM Run Command                 │
│                                           ▼                                 │
│                         ┌─────────────────────────────────────┐            │
│                         │            EC2 Instance              │            │
│                         │  ┌─────────────────────────────────┐│            │
│                         │  │      Docker Containers          ││            │
│                         │  │  ┌───────────┐ ┌─────────────┐  ││            │
│                         │  │  │  App      │ │  PostgreSQL │  ││            │
│                         │  │  │ (Next.js  │ │  (Database) │  ││            │
│                         │  │  │ +FastAPI) │ │             │  ││            │
│                         │  │  │ Port 80,  │ │  Port 5432  │  ││            │
│                         │  │  │ 8000      │ │             │  ││            │
│                         │  │  └───────────┘ └─────────────┘  ││            │
│                         │  │         app-network              ││            │
│                         │  └─────────────────────────────────┘│            │
│                         └─────────────────────────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## AWS Services Used

| Service | Purpose | Cost |
|---------|---------|------|
| **EC2** | Hosts the application containers | ~$8-15/month (t3.small) |
| **ECR** | Stores Docker images | Free tier: 500MB/month |
| **CodePipeline** | Orchestrates the CI/CD pipeline | Free tier: 1 pipeline |
| **CodeBuild** | Builds Docker images | Free tier: 100 min/month |
| **SSM** | Remote command execution on EC2 | Free |
| **Secrets Manager** | Stores sensitive configuration | ~$0.40/secret/month |

**Total estimated cost:** ~$10-20/month for a small project

---

## Prerequisites

Before starting, ensure you have:

1. AWS Account with appropriate permissions
2. GitHub repository with your code
3. AWS CLI installed locally (optional, for testing)
4. Basic understanding of Docker, Git, and AWS Console

---

## Step 1: ECR Repository Setup

ECR (Elastic Container Registry) stores your Docker images.

### Create ECR Repository

1. Go to **AWS Console → ECR → Repositories**
2. Click **Create repository**
3. Configure:
   - **Repository name:** `project-submission-and-review-portal`
   - **Image tag mutability:** Mutable (allows overwriting `latest` tag)
   - **Encryption:** AES-256 (default)
4. Click **Create repository**

### Repository URI

After creation, note your repository URI:
```
416684166855.dkr.ecr.ap-south-1.amazonaws.com/project-submission-and-review-portal
```

Format: `<account-id>.dkr.ecr.<region>.amazonaws.com/<repo-name>`

---

## Step 2: EC2 Instance Setup

### Launch EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Configure:
   - **Name:** `ProjectPortal-Server`
   - **AMI:** Amazon Linux 2023
   - **Instance type:** t3.small (2 vCPU, 2GB RAM) or t3.micro for testing
   - **Key pair:** Create or select existing (for SSH access)
   - **Security Group:** Create new with these rules:

### Security Group Rules

| Type | Port | Source | Purpose |
|------|------|--------|---------|
| SSH | 22 | Your IP | SSH access |
| HTTP | 80 | 0.0.0.0/0 | Frontend access |
| Custom TCP | 8000 | 0.0.0.0/0 | Backend API |
| Custom TCP | 5432 | Your IP | PostgreSQL (optional) |

### Install Docker on EC2

Connect via SSH and run:

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group (optional)
sudo usermod -aG docker ec2-user
```

---

## Step 3: IAM Roles Configuration

### A. EC2 Instance Role

Create an IAM role for EC2 with these policies:

**Role name:** `EC2CodeDeployForProjectSubmissionAndReviewPortal`

**Attached policies:**

1. **AmazonSSMManagedInstanceCore** (AWS managed)
   - Allows SSM to manage the instance

2. **AmazonEC2RoleforAWSCodeDeploy** (AWS managed)
   - Allows CodeDeploy access

3. **Custom: ECRPullAccess**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetAuthorizationToken"
            ],
            "Resource": "*"
        }
    ]
}
```

4. **Custom: SecretsManagerAccess** (if using Secrets Manager on EC2)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "arn:aws:secretsmanager:ap-south-1:416684166855:secret:dev/*"
        }
    ]
}
```

**Attach role to EC2:**
1. Go to EC2 → Select instance → Actions → Security → Modify IAM role
2. Select `EC2CodeDeployForProjectSubmissionAndReviewPortal`
3. Click Update

### B. CodeBuild Service Role

Create an IAM role for CodeBuild:

**Role name:** `codebuild-ProjectPortal-service-role`

**Attached policies:**

1. Basic CodeBuild permissions (auto-created)

2. **Custom: ECRPushAccess**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload"
            ],
            "Resource": "*"
        }
    ]
}
```

3. **Custom: SSMSendCommand**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:SendCommand",
                "ssm:GetCommandInvocation"
            ],
            "Resource": "*"
        }
    ]
}
```

4. **Custom: SecretsManagerRead**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "arn:aws:secretsmanager:ap-south-1:416684166855:secret:dev/*"
        }
    ]
}
```

---

## Step 4: Secrets Manager Setup

Store sensitive configuration securely.

### Create Secret

1. Go to **AWS Console → Secrets Manager → Store a new secret**
2. Select **Other type of secret**
3. Add key/value pairs:

| Key | Value | Purpose |
|-----|-------|---------|
| `NEXT_PUBLIC_API_URL` | `http://13.235.71.134:8000` | Frontend API endpoint |
| `ALLOWED_ORIGINS` | `http://13.235.71.134,http://localhost:3000` | CORS origins |
| `SECRET_KEY` | `your-secret-key-here` | JWT signing key |
| `DATABASE_URL` | `postgresql://postgres:postgres@postgres-db:5432/project_portal` | DB connection |

4. **Secret name:** `dev/project-submission-and-review-portal`
5. Click **Store**

### Accessing in CodeBuild

In `buildspec.yml`, reference secrets:
```yaml
env:
  secrets-manager:
    NEXT_PUBLIC_API_URL: dev/project-submission-and-review-portal:NEXT_PUBLIC_API_URL
```

---

## Step 5: CodeBuild Project Setup

### Create CodeBuild Project

1. Go to **AWS Console → CodeBuild → Create project**

2. **Project configuration:**
   - Project name: `ProjectSubmissionAndReviewPortal-Build`
   - Description: Build and deploy to ECR

3. **Source:**
   - Source provider: GitHub
   - Repository: Connect and select your repo
   - Branch: `dev`

4. **Environment:**
   - Environment image: Managed image
   - Operating system: Amazon Linux 2
   - Runtime: Standard
   - Image: `aws/codebuild/amazonlinux2-x86_64-standard:5.0`
   - Privileged: ✅ **Enable** (required for Docker)
   - Service role: Select `codebuild-ProjectPortal-service-role`

5. **Environment variables:**

| Name | Value | Type |
|------|-------|------|
| `AWS_REGION` | `ap-south-1` | Plaintext |
| `EC2_INSTANCE_ID` | `i-03d7810e2b364665f` | Plaintext |
| `IMAGE_REPO_NAME` | `project-submission-and-review-portal` | Plaintext |

6. **Buildspec:**
   - Use a buildspec file: `buildspec.yml`

7. Click **Create build project**

---

## Step 6: CodePipeline Setup

### Create Pipeline

1. Go to **AWS Console → CodePipeline → Create pipeline**

2. **Pipeline settings:**
   - Pipeline name: `ProjectSubmissionAndReviewPortal-Pipeline`
   - Service role: Create new or use existing

3. **Source stage:**
   - Source provider: GitHub (Version 2)
   - Connection: Create or select GitHub connection
   - Repository: Your repo
   - Branch: `dev`
   - Trigger: Push to branch

4. **Build stage:**
   - Build provider: AWS CodeBuild
   - Project name: Select your CodeBuild project

5. **Deploy stage:**
   - Skip (deployment happens via SSM in CodeBuild)

6. Click **Create pipeline**

---

## Step 7: Database Setup on EC2

Set up PostgreSQL in a Docker container on EC2.

### Create Docker Network

```bash
sudo docker network create app-network
```

**Why?** Containers on the same network can communicate using container names as hostnames.

### Start PostgreSQL Container

```bash
sudo docker run -d --name postgres-db \
  --network app-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=project_portal \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:15-alpine
```

**Explanation:**
- `-d` - Run in background (detached)
- `--name postgres-db` - Container name (used as hostname)
- `--network app-network` - Connect to our network
- `-e POSTGRES_*` - Environment variables for initial setup
- `-p 5432:5432` - Expose port 5432
- `-v postgres_data:/var/lib/postgresql/data` - Persist data in named volume
- `--restart unless-stopped` - Auto-restart on reboot
- `postgres:15-alpine` - Lightweight PostgreSQL image

### Start Application Container

```bash
sudo docker run -d --name project-portal \
  --network app-network \
  -e DATABASE_URL=postgresql://postgres:postgres@postgres-db:5432/project_portal \
  -p 80:3000 -p 8000:8000 \
  --restart unless-stopped \
  416684166855.dkr.ecr.ap-south-1.amazonaws.com/project-submission-and-review-portal:latest
```

**Explanation:**
- `DATABASE_URL=...@postgres-db:5432/...` - Uses container name as hostname
- `-p 80:3000` - Map host port 80 to container port 3000 (frontend)
- `-p 8000:8000` - Map port 8000 for backend API

### Run Database Migrations

```bash
sudo docker exec project-portal bash -c "cd /app/backend && python -m alembic upgrade head"
```

This creates all database tables defined in your Alembic migrations.

---

## Step 8: Buildspec Configuration

The `buildspec.yml` file defines how CodeBuild builds and deploys your application.

### Complete buildspec.yml

```yaml
# AWS CodeBuild Buildspec for Project Submission & Review Portal
# Builds Docker image in CodeBuild, pushes to ECR, deploys to EC2 via SSM

version: 0.2

env:
  variables:
    IMAGE_REPO_NAME: "project-submission-and-review-portal"
  secrets-manager:
    NEXT_PUBLIC_API_URL: dev/project-submission-and-review-portal:NEXT_PUBLIC_API_URL

phases:
  pre_build:
    commands:
      - echo "Starting build at $(date)"
      - AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
      - echo "AWS Account ID = $AWS_ACCOUNT_ID"
      - echo "Logging into Amazon ECR..."
      - aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
      - IMAGE_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_REPO_NAME
      - IMAGE_TAG=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - echo "Image URI = $IMAGE_URI"
      - echo "Image Tag = $IMAGE_TAG"
      - echo "NEXT_PUBLIC_API_URL = $NEXT_PUBLIC_API_URL"

  build:
    commands:
      - echo "Building Docker image..."
      - docker build --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL -t $IMAGE_REPO_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $IMAGE_URI:$IMAGE_TAG
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $IMAGE_URI:latest
      - echo "Docker build completed!"

  post_build:
    commands:
      - echo "Pushing Docker image to ECR..."
      - docker push $IMAGE_URI:$IMAGE_TAG
      - docker push $IMAGE_URI:latest
      - echo "Image pushed successfully!"
      - echo "Deploying to EC2 via SSM..."
      - |
        COMMAND_ID=$(aws ssm send-command \
          --instance-ids "$EC2_INSTANCE_ID" \
          --document-name "AWS-RunShellScript" \
          --timeout-seconds 300 \
          --parameters commands='[
            "sudo systemctl start docker",
            "aws ecr get-login-password --region ap-south-1 | sudo docker login --username AWS --password-stdin 416684166855.dkr.ecr.ap-south-1.amazonaws.com",
            "sudo docker pull 416684166855.dkr.ecr.ap-south-1.amazonaws.com/project-submission-and-review-portal:latest",
            "sudo docker stop project-portal || true",
            "sudo docker rm project-portal || true",
            "sudo docker network create app-network || true",
            "sudo docker network connect app-network postgres-db || true",
            "sudo docker run -d --name project-portal --network app-network -e DATABASE_URL=postgresql://postgres:postgres@postgres-db:5432/project_portal --restart unless-stopped -p 80:3000 -p 8000:8000 416684166855.dkr.ecr.ap-south-1.amazonaws.com/project-submission-and-review-portal:latest",
            "sudo docker ps"
          ]' \
          --region "$AWS_REGION" \
          --query "Command.CommandId" \
          --output text)
        echo "SSM Command ID: $COMMAND_ID"
        echo "Waiting for deployment..."
        sleep 60
        STATUS=$(aws ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$EC2_INSTANCE_ID" --region "$AWS_REGION" --query "Status" --output text)
        echo "Deployment Status: $STATUS"
      - echo "Deployment completed!"

artifacts:
  files:
    - '**/*'
```

### Build Phases Explained

| Phase | Purpose |
|-------|---------|
| **pre_build** | Login to ECR, set variables |
| **build** | Build Docker image with build args |
| **post_build** | Push to ECR, deploy via SSM |

---

## How the Pipeline Works

### Trigger → Build → Deploy Flow

```
1. Developer pushes to 'dev' branch on GitHub
                    │
                    ▼
2. CodePipeline detects change (webhook)
                    │
                    ▼
3. CodeBuild starts:
   a. Pulls source code from GitHub
   b. Reads secrets from Secrets Manager
   c. Builds Docker image
   d. Pushes image to ECR
                    │
                    ▼
4. SSM sends commands to EC2:
   a. Login to ECR
   b. Pull latest image
   c. Stop old container
   d. Start new container with DATABASE_URL
                    │
                    ▼
5. Application is live!
```

### What Happens in Each Step

**Step 1-2: Trigger**
- GitHub webhook notifies CodePipeline
- Pipeline starts automatically

**Step 3: Build**
- CodeBuild spins up a container
- Runs `docker build` with your Dockerfile
- `NEXT_PUBLIC_API_URL` is passed as build arg (baked into frontend)
- Image is tagged with commit hash and `latest`
- Image is pushed to ECR

**Step 4: Deploy**
- SSM sends shell commands to EC2
- EC2 pulls the new image from ECR
- Old container is stopped and removed
- New container starts with environment variables
- Container connects to `app-network` to reach PostgreSQL

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "Network Error" in Browser

**Cause:** Corporate firewall (Zscaler) blocking AWS IPs

**Solution:** Test from mobile data or personal network

#### 2. "Internal Server Error" on Login

**Cause:** Database connection failed

**Check:**
```bash
sudo docker logs project-portal --tail 50
sudo docker exec project-portal cat /var/log/supervisor/backend.err.log | tail -50
```

**Solution:** Ensure PostgreSQL container is running and on same network

#### 3. SSM Command Failed

**Cause:** SSM Agent offline or IAM role missing

**Check:**
- Systems Manager → Fleet Manager → Instance status
- Verify IAM role has `AmazonSSMManagedInstanceCore`

**Solution:** Reboot EC2 or attach correct IAM role

#### 4. "403 Forbidden" on API Calls

**Cause:** CORS not configured for your origin

**Solution:** Add your URL to `ALLOWED_ORIGINS` in `backend/app/core/config.py`:
```python
ALLOWED_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://13.235.71.134",  # Add your EC2 IP
]
```

#### 5. ECR Push Permission Denied

**Cause:** CodeBuild role missing ECR permissions

**Solution:** Add ECR push policy to CodeBuild service role

---

## Useful Commands

### Docker Commands (Run on EC2 via SSM)

```bash
# List running containers
sudo docker ps

# List all containers (including stopped)
sudo docker ps -a

# View container logs
sudo docker logs project-portal --tail 100

# View specific log file
sudo docker exec project-portal cat /var/log/supervisor/backend.err.log | tail -50

# Restart container
sudo docker restart project-portal

# Stop and remove container
sudo docker stop project-portal && sudo docker rm project-portal

# List Docker networks
sudo docker network ls

# List Docker volumes
sudo docker volume ls
```

### Database Commands (PostgreSQL)

```bash
# Connect to PostgreSQL
sudo docker exec -it postgres-db psql -U postgres -d project_portal

# Inside psql:
\dt                     # List tables
SELECT * FROM users;    # View users
\q                      # Quit
```

### Pipeline Commands (AWS CLI)

```bash
# Start pipeline manually
aws codepipeline start-pipeline-execution --name ProjectSubmissionAndReviewPortal-Pipeline

# Get pipeline status
aws codepipeline get-pipeline-state --name ProjectSubmissionAndReviewPortal-Pipeline
```

---

## Summary

### What We Built

1. **Automated CI/CD Pipeline** - Push to GitHub → Auto-deploy to EC2
2. **Containerized Application** - Docker for consistent environments
3. **ECR Image Registry** - Secure, versioned Docker images
4. **SSM Deployment** - No SSH needed, commands via AWS Console
5. **PostgreSQL Database** - Running alongside app in Docker
6. **Docker Networking** - Containers communicate securely

### Key Learnings

- **Docker Networks** allow containers to communicate using container names
- **Docker Volumes** persist data across container restarts
- **IAM Roles** control what AWS services can access
- **SSM** provides secure remote command execution
- **Secrets Manager** keeps sensitive data out of code
- **Build Args vs Env Vars** - Build args are baked in at build time, env vars are set at runtime

### Next Steps

1. **Add HTTPS** - Use AWS Certificate Manager + Load Balancer
2. **Add Domain** - Route 53 for custom domain
3. **Add Monitoring** - CloudWatch for logs and metrics
4. **Add Backups** - Automated PostgreSQL backups
5. **Use RDS** - Managed database for production

---

*Last updated: September 11, 2026*

---

## Key Concepts Explained

### Docker Networking

**Problem:** How do containers talk to each other?

**Solution:** Docker Networks

```bash
# Create a network
docker network create app-network

# Run containers on the same network
docker run --network app-network --name postgres-db postgres
docker run --network app-network --name app myapp

# Now 'app' can reach postgres at hostname 'postgres-db'
DATABASE_URL=postgresql://postgres:postgres@postgres-db:5432/mydb
```

**Key insight:** Container names become DNS hostnames within the network.

### Docker Volumes

**Problem:** Container data is lost when container is removed.

**Solution:** Named Volumes

```bash
# Create volume automatically
docker run -v postgres_data:/var/lib/postgresql/data postgres

# Data persists even if container is removed
docker rm postgres-db
docker run -v postgres_data:/var/lib/postgresql/data postgres  # Data still there!
```

**Types of volumes:**
- **Named volumes** (`-v mydata:/path`) - Docker manages location
- **Bind mounts** (`-v /host/path:/container/path`) - You specify host location

### Build Args vs Environment Variables

```dockerfile
# Build arg - available during build only
ARG NEXT_PUBLIC_API_URL
RUN npm run build  # Uses the arg

# Environment variable - available at runtime
ENV DATABASE_URL=...
CMD ["python", "app.py"]  # Uses the env var
```

| Feature | Build Arg | Env Var |
|---------|-----------|---------|
| When available | During build | At runtime |
| Baked into image | Yes (if used) | No |
| Can change without rebuild | No | Yes |
| Use case | Frontend URLs, build config | Secrets, DB URLs |

### CORS (Cross-Origin Resource Sharing)

**Problem:** Browser blocks requests from `http://frontend.com` to `http://api.com`

**Solution:** Backend must allow the origin

```python
# Backend must explicitly allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://13.235.71.134"],  # Frontend URL
    allow_credentials=True,  # For cookies
)
```

**Common error:** "403 Forbidden" when frontend origin not in allow list.

### httpOnly Cookies vs localStorage

| Feature | httpOnly Cookie | localStorage |
|---------|-----------------|--------------|
| JavaScript access | No (secure!) | Yes |
| XSS vulnerability | Protected | Vulnerable |
| Sent automatically | Yes | No (manual header) |
| CSRF vulnerability | Possible | Protected |
| Best for | Auth tokens | Non-sensitive data |

**Best practice:** Use httpOnly cookies for authentication tokens.

### JWT Token Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    JWT STRUCTURE                             │
├─────────────────────────────────────────────────────────────┤
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.                       │
│ eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNjE2MjM5MDIyfQ.         │
│ SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c                 │
│                                                             │
│ Header.Payload.Signature                                    │
│                                                             │
│ Payload contains:                                           │
│ - sub: user ID                                              │
│ - exp: expiration time                                      │
│ - iat: issued at time                                       │
└─────────────────────────────────────────────────────────────┘
```

**Access Token:** Short-lived (15 min), used for API requests
**Refresh Token:** Long-lived (7 days), used to get new access token

---

## Best Practices Learned

### 1. Frontend Best Practices

```typescript
// ✅ Good: Centralized API configuration
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// ❌ Bad: Hardcoded URLs everywhere
fetch("http://localhost:8000/api/users");
```

```typescript
// ✅ Good: Service layer for API calls
const user = await authService.getCurrentUser();

// ❌ Bad: API calls directly in components
const response = await axios.get("/auth/me");
```

```typescript
// ✅ Good: Context for global state
const { user, login, logout } = useAuth();

// ❌ Bad: Prop drilling through many components
<Parent user={user}><Child user={user}><GrandChild user={user}/></Child></Parent>
```

### 2. Backend Best Practices

```python
# ✅ Good: Dependency injection
@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return user

# ❌ Bad: Manual auth checking in every route
@router.get("/me")
async def get_me(request: Request):
    token = request.cookies.get("access_token")
    user = validate_token(token)  # Repeated everywhere
    return user
```

```python
# ✅ Good: Pydantic settings with env vars
class Settings(BaseSettings):
    SECRET_KEY: str
    class Config:
        env_file = ".env"

# ❌ Bad: Hardcoded secrets
SECRET_KEY = "my-secret-key"
```

```python
# ✅ Good: Explicit CORS origins
allow_origins=["http://13.235.71.134"]

# ❌ Bad: Allow all origins with credentials (doesn't work!)
allow_origins=["*"]  # Error with allow_credentials=True
```

### 3. Docker Best Practices

```dockerfile
# ✅ Good: Multi-stage build
FROM node:18-alpine AS builder
RUN npm run build

FROM node:18-alpine
COPY --from=builder /app/.next ./.next

# ❌ Bad: Single stage with dev dependencies
FROM node:18
RUN npm install  # Includes devDependencies
RUN npm run build
```

```bash
# ✅ Good: Named volumes for persistence
docker run -v postgres_data:/var/lib/postgresql/data postgres

# ❌ Bad: No volume (data lost on container removal)
docker run postgres
```

```bash
# ✅ Good: Docker network for container communication
docker network create app-network
docker run --network app-network --name db postgres
docker run --network app-network -e DATABASE_URL=...@db:5432 app

# ❌ Bad: Using host IP
docker run -e DATABASE_URL=...@172.17.0.2:5432 app  # IP can change!
```

### 4. AWS Best Practices

```yaml
# ✅ Good: Use Secrets Manager for sensitive data
env:
  secrets-manager:
    SECRET_KEY: my-app/secret:SECRET_KEY

# ❌ Bad: Secrets in buildspec or environment variables
env:
  variables:
    SECRET_KEY: "hardcoded-secret"  # Visible in logs!
```

```bash
# ✅ Good: IAM roles for EC2 (no credentials in code)
# EC2 automatically gets credentials from attached role

# ❌ Bad: Hardcoded AWS credentials
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

---

## Common Mistakes and How to Avoid Them

### Mistake 1: "Network Error" on Frontend

**Symptom:** API calls fail with "Network Error"

**Causes:**
1. CORS not configured for frontend origin
2. Corporate firewall blocking requests
3. Backend not running

**Debug steps:**
```bash
# Test if backend is responding
curl http://13.235.71.134:8000/health

# Check CORS in response
curl -I http://13.235.71.134:8000/health
# Look for: Access-Control-Allow-Origin header
```

### Mistake 2: "403 Forbidden" on Login

**Symptom:** POST /auth/login returns 403

**Cause:** Frontend origin not in ALLOWED_ORIGINS

**Fix:**
```python
# backend/app/core/config.py
ALLOWED_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://13.235.71.134",  # Add your frontend URL
]
```

### Mistake 3: "Internal Server Error" on API Calls

**Symptom:** 500 error on any API call

**Cause:** Usually database connection failed

**Debug:**
```bash
# Check backend logs
docker logs project-portal
docker exec project-portal cat /var/log/supervisor/backend.err.log

# Common cause: DATABASE_URL pointing to wrong host
# Fix: Ensure postgres container is on same network
```

### Mistake 4: Container Can't Reach Database

**Symptom:** "Connection refused" to postgres

**Cause:** Containers not on same network

**Fix:**
```bash
# Create network and connect both containers
docker network create app-network
docker network connect app-network postgres-db
docker network connect app-network project-portal
```

### Mistake 5: Environment Variables Not Working

**Symptom:** `NEXT_PUBLIC_API_URL` is undefined in browser

**Cause:** Frontend env vars must be set at BUILD time, not runtime

**Fix:**
```bash
# Build with the arg
docker build --build-arg NEXT_PUBLIC_API_URL=http://13.235.71.134:8000 .

# NOT at runtime
docker run -e NEXT_PUBLIC_API_URL=...  # This won't work for Next.js!
```

---

## Quick Reference Commands

### Docker

```bash
# Start containers
docker run -d --name app --network app-network -p 80:3000 image

# View logs
docker logs -f container_name
docker exec container_name cat /var/log/supervisor/backend.err.log

# Execute command in container
docker exec -it container_name bash
docker exec container_name python -m alembic upgrade head

# Network operations
docker network create mynetwork
docker network connect mynetwork container_name
docker network ls

# Volume operations
docker volume ls
docker volume rm volume_name

# Cleanup
docker stop $(docker ps -q)      # Stop all containers
docker rm $(docker ps -aq)       # Remove all containers
docker system prune -a           # Remove everything unused
```

### PostgreSQL

```bash
# Connect to database
docker exec -it postgres-db psql -U postgres -d project_portal

# SQL commands
\dt                              # List tables
\d tablename                     # Describe table
SELECT * FROM users;             # Query data
\q                               # Quit
```

### Git

```bash
# Push changes
git add .
git commit -m "message"
git push origin dev

# View history
git log --oneline -10
```

### AWS CLI

```bash
# ECR login
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 416684166855.dkr.ecr.ap-south-1.amazonaws.com

# SSM run command
aws ssm send-command \
  --instance-ids "i-xxxxx" \
  --document-name "AWS-RunShellScript" \
  --parameters commands='["docker ps"]'
```

---

## Glossary

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface - how frontend talks to backend |
| **CORS** | Cross-Origin Resource Sharing - browser security for cross-domain requests |
| **JWT** | JSON Web Token - encoded token containing user info |
| **ORM** | Object-Relational Mapping - Python objects represent database tables |
| **DTO** | Data Transfer Object - schema for request/response data |
| **SSM** | AWS Systems Manager - remote command execution |
| **ECR** | Elastic Container Registry - Docker image storage |
| **IAM** | Identity and Access Management - AWS permissions |
| **httpOnly** | Cookie flag preventing JavaScript access |
| **SameSite** | Cookie flag for CSRF protection |

---

## Resources for Further Learning

### Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Docker](https://docs.docker.com/)
- [AWS CodePipeline](https://docs.aws.amazon.com/codepipeline/)

### Tutorials

- [JWT Authentication Best Practices](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)
- [Docker Networking](https://docs.docker.com/network/)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

*This guide was created during the deployment of the Project Submission & Review Portal to AWS EC2. It covers both the infrastructure setup and the application architecture patterns used.*

*Last updated: September 11, 2026*
