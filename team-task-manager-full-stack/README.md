# Team Task Manager Full-Stack App

Team Task Manager is a full-stack assignment project where users can create projects, manage project teams, assign tasks, update task status, and track progress with Admin and Member role-based access.

## Features

- User signup and login
- Admin and Member roles
- Role-based access control
- Project creation and team member management
- Task creation, assignment, due dates, and status tracking
- Dashboard with total tasks, completion, overdue tasks, and project progress
- REST API backend with validations
- Database relationships between users, projects, project members, and tasks

## Tech Stack

- Frontend: React, HTML, CSS
- Backend: Node.js HTTP server
- Database: JSON document database stored in `backend/data/db.json`
- Auth: Token-based auth with hashed passwords

## Run Locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:5000
```

## Demo Login

The app creates default users automatically on first run:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@example.com | admin123 |
| Member | member@example.com | member123 |

You can also create your own account from the signup screen.

## Project Structure

```text
team-task-manager-full-stack/
  backend/
    server.js
    data/
      seed.json
  frontend/
    index.html
    src/
      app.js
      styles.css
  package.json
  render.yaml
  README.md
```

## Main API Routes

### Auth

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users

- `GET /api/users`

### Projects

- `GET /api/projects`
- `POST /api/projects` Admin only
- `PATCH /api/projects/:id/team` Admin only

### Tasks

- `GET /api/tasks`
- `POST /api/tasks` Admin only
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id` Admin only

### Dashboard

- `GET /api/dashboard`

## Role Rules

- Admin can create projects, manage project teams, create tasks, assign tasks, update any task, and delete tasks.
- Member can view assigned/team project tasks and update status for tasks assigned to them.

## Easy Explanation

The backend serves both the REST API and the frontend. When a user logs in, the server checks the email and password, creates a token, and the frontend stores that token in `localStorage`. Every protected API request sends the token in the `Authorization` header.

Projects store `memberIds`, so the app knows which users belong to each project. Tasks store `projectId` and `assignedTo`, which creates the relationship between a task, its project, and its assigned team member. Admin users can create and manage everything. Member users can only see relevant project/team tasks and can update the status of tasks assigned to them.

The dashboard calculates totals, completed percentage, overdue count, and project progress from the task data.

## Deploy On Render

1. Push this project to GitHub.
2. Open [Render](https://render.com).
3. Create a new Web Service from the GitHub repository.
4. Use these settings:

```text
Build Command: npm install
Start Command: npm start
```

Render will generate a public live URL after deployment.

## GitHub Submission

This project has no external npm dependencies, so it is easy to run after cloning:

```bash
git clone <your-repo-url>
cd team-task-manager-full-stack
npm install
npm start
```
