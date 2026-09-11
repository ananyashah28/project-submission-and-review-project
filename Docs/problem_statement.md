# PROJECT PROBLEM STATEMENT

## Project Submission & Review Portal
**Full-Stack Web Application | Next.js + Python FastAPI + AWS**

---

## 1. Introduction

The Project Submission & Review Portal is a full-stack web application designed to provide a centralized platform where users can create, manage, and submit software projects along with related files such as screenshots, project reports, presentations, and source-code archives. The system will also provide a structured way to review project information and track submission status.

---

## 2. Problem Statement

Project information is often scattered across local folders, cloud drives, emails, messaging applications, and different project-management tools. This makes it difficult to maintain a consistent record of projects, their descriptions, technologies, supporting files, and review status.

The proposed system aims to solve this problem by providing a simple centralized platform where users can:
- Create project records
- Upload project-related files
- Update project information
- Manage their submissions through a single dashboard

The application should provide a clean separation between the frontend, backend, data storage, and deployment infrastructure.

---

## 3. Objectives

- Build a modern frontend using **Next.js** and **TypeScript**
- Build a REST API backend using **Python** and **FastAPI**
- Implement user registration, login, and protected application areas
- Allow users to create, edit, view, and delete project records
- Allow users to upload and manage project-related files
- Use **Amazon S3** for scalable file/object storage
- Connect the frontend and backend through well-structured APIs
- Deploy the application on an **AWS EC2** instance
- Use **GitHub** as the source-code repository
- Implement a basic CI/CD workflow using **AWS CodeBuild**
- Understand environment variables, server configuration, logs, permissions, and production deployment

---

## 4. Target Users

- **Students** managing academic and personal projects
- **Developers** maintaining a portfolio of software projects
- **Teams** submitting projects for internal review
- **Mentors or reviewers** who need to inspect project submissions

---

## 5. Core Functional Requirements

### 5.1 Authentication
- User registration
- User login and logout
- Password validation and secure password storage
- Protected dashboard and project routes
- Authentication-aware frontend navigation

### 5.2 Project Management
- Create a new project
- Enter project title, description, category, and technology stack
- Add GitHub repository and live-demo links
- View a list of the user's projects
- View detailed information for an individual project
- Edit project information
- Delete a project

### 5.3 File Management
- Upload project screenshots
- Upload project reports or presentations
- Upload source-code archives when required
- Display uploaded files associated with a project
- Download or access stored files
- Delete project files
- Store files in **Amazon S3** rather than directly on the EC2 server

### 5.4 Project Review / Status
- Projects can have a status such as: `Draft`, `Submitted`, `Under Review`, `Approved`, or `Changes Requested`
- The dashboard should clearly display the current status
- A reviewer can add a short review comment
- A user can see the review feedback associated with the project

---

## 6. Suggested Project Workflow

1. **Register:** User creates an account
2. **Login:** User authenticates and enters the dashboard
3. **Create Project:** User creates a project with basic information
4. **Upload Files:** User uploads screenshots, reports, or other project files
5. **Submit:** User submits the project for review
6. **Review:** Reviewer checks the project and adds feedback/status
7. **Update:** User can make requested changes and resubmit
8. **Manage:** User can continue viewing, editing, and managing the project

---

## 7. High-Level Technical Architecture

The application should follow a **client-server architecture** with a clear separation of concerns:

| Component | Responsibility |
|-----------|----------------|
| **Next.js frontend** | UI, routing, forms, client-side interactions, and API communication |
| **FastAPI backend** | Authentication, validation, business logic, project APIs, and S3 integration |
| **Database** | Users, projects, file metadata, review status, and comments |
| **Amazon S3** | Project files and uploaded objects |
| **EC2** | Hosts the production application |
| **GitHub** | Stores application source code |
| **AWS CodeBuild** | Builds, tests, and supports automated deployment |

---

## 8. Initial API Requirements

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | User login |
| GET | `/users/me` | Get current user info |
| GET | `/projects` | List user's projects |
| POST | `/projects` | Create a new project |
| GET | `/projects/{project_id}` | Get project details |
| PUT | `/projects/{project_id}` | Update a project |
| DELETE | `/projects/{project_id}` | Delete a project |
| POST | `/projects/{project_id}/files` | Upload files to a project |
| GET | `/projects/{project_id}/files` | List project files |
| DELETE | `/files/{file_id}` | Delete a file |
| POST | `/projects/{project_id}/submit` | Submit project for review |
| POST | `/projects/{project_id}/review` | Add review to a project |

---

## 9. Suggested Data Model

### User
| Field | Type |
|-------|------|
| id | Primary Key |
| name | String |
| email | String (unique) |
| password_hash | String |
| created_at | Timestamp |

### Project
| Field | Type |
|-------|------|
| id | Primary Key |
| user_id | Foreign Key (User) |
| title | String |
| description | Text |
| category | String |
| technologies | String/Array |
| github_url | String |
| demo_url | String |
| status | Enum |
| review_comment | Text |
| created_at | Timestamp |
| updated_at | Timestamp |

### ProjectFile
| Field | Type |
|-------|------|
| id | Primary Key |
| project_id | Foreign Key (Project) |
| file_name | String |
| file_type | String |
| s3_key | String |
| file_size | Integer |
| created_at | Timestamp |

---

## 10. Non-Functional Requirements

- Responsive and user-friendly interface
- Clear frontend component and folder structure
- RESTful and maintainable backend API design
- Validation on both frontend and backend
- Secure handling of authentication credentials and environment variables
- Proper AWS IAM permissions for S3 access
- Production logs and basic error handling
- Application should be deployable from a GitHub repository through the defined CI/CD process

---

## 11. Recommended Technology Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js, TypeScript, Tailwind CSS |
| **Backend** | Python, FastAPI |
| **Database** | PostgreSQL (recommended for production) |
| **Object Storage** | Amazon S3 |
| **Hosting** | Amazon EC2 |
| **CI/CD** | GitHub + AWS CodeBuild |
| **Web Server / Reverse Proxy** | Nginx |
| **Authentication** | JWT-based authentication |
| **Version Control** | Git + GitHub |

---

## 12. Learning Goals

The project is intentionally scoped to be small enough for an individual developer while covering the complete lifecycle of a modern full-stack application:

- Understand the ideal structure of a Next.js frontend
- Understand frontend-to-backend API communication
- Understand FastAPI routing, schemas, services, and authentication
- Understand database-backed CRUD operations
- Understand multipart file uploads and S3 object storage
- Understand AWS IAM and environment configuration
- Understand EC2-based application deployment
- Understand GitHub-based development workflow
- Understand AWS CodeBuild and basic CI/CD
- Understand how a local application is converted into a production application

---

## 13. Future Enhancements

- Role-based access for Admin, Reviewer, and User
- Email notifications for project status changes
- Project search and filtering
- Project tags and categories
- Image previews
- S3 presigned URLs for controlled file access
- Automated testing in the CI/CD pipeline
- Docker-based deployment
- CloudFront for static/file delivery
- AI-assisted project description generation or project classification

---

## 14. Project Scope — Version 1

Version 1 should remain intentionally simple. The primary goal is to understand the complete flow:

```
frontend → API → backend → database/S3 → deployment
```

Advanced AWS services, microservices, Kubernetes, Redis, queues, and complex AI features should be postponed until the basic production deployment is working reliably.

---

## 15. Expected Outcome

At the end of the project, the developer should have a **working production application** in which:

- A user can authenticate
- Create and manage projects
- Upload project files to Amazon S3
- Interact with a Python FastAPI backend through a Next.js frontend

The application should be:
- Hosted on **AWS EC2**
- Have a **GitHub-to-AWS CodeBuild** deployment workflow

---

*Document Version: 1.0*
