# Team Task Manager

A simple full-stack assignment project where users can create projects, assign tasks, and track progress with Admin and Member roles.

## Features

- Signup and login authentication
- Admin and Member role-based access
- Admin can create projects
- Admin can create tasks and assign them to team members
- Members can view and update only their assigned tasks
- Dashboard shows total, To Do, In Progress, Done, and Overdue tasks
- REST API backend
- Local JSON NoSQL database with users, sessions, projects, and tasks
- Basic validations for required fields, email, password, role, task status, due date, project, and assignee relationships

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js HTTP server
- Database: `db.json` local NoSQL JSON file
- API style: REST

## Project Files

```text
team-task-manager/
  index.html
  styles.css
  app.js
  server.js
  db.json
  package.json
  render.yaml
  README.md
```

## How To Run

```powershell
npm start
```

Open:

```text
http://localhost:5600
```

## Demo Login

Admin:

```text
Email: admin@example.com
Password: admin123
```

Member:

```text
Email: member@example.com
Password: member123
```

## API Routes

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Check server status |
| `POST` | `/api/auth/signup` | Public | Create a new user |
| `POST` | `/api/auth/login` | Public | Login and receive token |
| `POST` | `/api/auth/logout` | Logged in | Remove current session |
| `GET` | `/api/me` | Logged in | Get current user |
| `GET` | `/api/dashboard` | Logged in | Get projects, tasks, users, and stats |
| `POST` | `/api/projects` | Admin | Create project |
| `POST` | `/api/tasks` | Admin | Create task |
| `PATCH` | `/api/tasks/:id` | Admin or assigned Member | Update task status |

## Deploy On Render

1. Push this project to GitHub.
2. Go to `https://render.com`.
3. Click `New` > `Web Service`.
4. Connect your GitHub repository.
5. Use these settings:

```text
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

Render will give a public URL like:

```text
https://team-task-manager.onrender.com
```

Note: `db.json` is good for an assignment demo. For production, use MongoDB Atlas, PostgreSQL, or Supabase.
