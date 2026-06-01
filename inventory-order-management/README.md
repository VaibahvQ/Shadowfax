# Inventory & Order Management System

Simplified full-stack assessment project for managing products, customers, orders, and stock tracking.

## Features

- FastAPI backend with REST endpoints for products, customers, orders, and dashboard metrics.
- React frontend with responsive product, customer, and order management views.
- PostgreSQL persistence using SQLAlchemy models.
- Business rules:
  - Product SKUs are unique.
  - Customer emails are unique.
  - Product stock cannot be negative.
  - Orders require at least one item.
  - Orders fail when requested stock is unavailable.
  - Successful orders automatically reduce inventory in one database transaction.
- Docker and Docker Compose for local containerized setup.
- Environment variables for database, CORS, and API URL configuration.

## Tech Stack

- Backend: Python, FastAPI, SQLAlchemy, PostgreSQL
- Frontend: React, Vite, lucide-react
- Database: PostgreSQL 16
- Containerization: Docker, Docker Compose

## Local Run With Docker Compose

1. Copy environment values:

```bash
cp .env.example .env
```

2. Start all services:

```bash
docker compose up --build
```

3. Open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Local Run Without Docker

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set DATABASE_URL=postgresql+psycopg://inventory_user:inventory_password@localhost:5432/inventory_db
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
set VITE_API_URL=http://localhost:8000
npm run dev
```

## API Endpoints

- `GET /health`
- `GET /dashboard`
- `GET /products`
- `POST /products`
- `PATCH /products/{product_id}`
- `DELETE /products/{product_id}`
- `GET /customers`
- `POST /customers`
- `PATCH /customers/{customer_id}`
- `DELETE /customers/{customer_id}`
- `GET /orders`
- `POST /orders`

## Render Deployment Guide

This repository includes a `render.yaml` Blueprint that creates:

- `inventory-order-db` PostgreSQL database
- `inventory-order-backend` FastAPI Docker web service
- `inventory-order-frontend` React static site

Deploy steps:

1. Push this project to GitHub.
2. Open Render Dashboard and choose **New > Blueprint**.
3. Select the GitHub repository that contains this `render.yaml`.
4. Deploy the Blueprint.
5. After deployment, verify:

- Frontend: `https://inventory-order-frontend.onrender.com`
- Backend API: `https://inventory-order-backend.onrender.com`
- Backend health: `https://inventory-order-backend.onrender.com/health`
- API docs: `https://inventory-order-backend.onrender.com/docs`

Manual backend environment variables, if deploying without the Blueprint:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DB_NAME
CORS_ORIGINS=https://inventory-order-frontend.onrender.com
APP_ENV=production
```

Manual frontend environment variables, if deploying without the Blueprint:

```env
VITE_API_URL=https://inventory-order-backend.onrender.com
```

Docker image build and push example:

```bash
docker build -t your-dockerhub-username/inventory-backend:latest ./backend
docker push your-dockerhub-username/inventory-backend:latest
docker build --build-arg VITE_API_URL=https://your-backend-api.onrender.com -t your-dockerhub-username/inventory-frontend:latest ./frontend
docker push your-dockerhub-username/inventory-frontend:latest
```

## Submission Checklist

Fill these after deploying with your accounts:

- GitHub repository link: `PENDING - create/push from your GitHub account`
- Docker backend image link: `PENDING - requires your Docker Hub or GHCR account`
- Docker frontend image link: `PENDING - requires your Docker Hub or GHCR account`
- Frontend hosted URL: `https://inventory-order-frontend.onrender.com`
- Backend API hosted URL: `https://inventory-order-backend.onrender.com`

## Notes

The backend creates tables and inserts sample products/customers on first startup. For production, use a migration tool such as Alembic before expanding the system.
