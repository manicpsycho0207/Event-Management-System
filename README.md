# Event Management System

A role-based college event management system built for the A4 assessment requirement. Administrators create and manage events, while students browse upcoming events, register for available seats, and join a First-Come, First-Served (FIFO) waitlist when an event is full.

## Features

### Admin
- Log in and manage events: create, edit, and delete.
- View confirmed attendees, event capacity, and available seats.
- View waitlisted students in FIFO order.
- Mark confirmed attendees as **Attended** or **Absent**.

### Student
- Register and log in.
- Browse upcoming events and see date, time, capacity, confirmed registrations, and available seats.
- Register while a seat is available or join the waitlist when full.
- View registration status, attendance status, and actual FIFO waitlist position.
- Cancel a confirmed registration and see current registrations and waitlist entries.

New registrations and promoted students have **Pending** attendance by default.

## Registration Rules

- Only `confirmed` registrations count toward event capacity; cancelled registrations and waitlist entries do not.
- A student cannot register twice, join a waitlist while already registered, join the same waitlist twice, or join a waitlist while seats remain.
- Each queue entry stores `joinedAt`; queue operations sort by `joinedAt` and use the entry ID as a deterministic tie-breaker.
- Cancelling a confirmed registration and promoting the oldest waitlisted student are performed in one MongoDB transaction.
- The promoted student is removed from the queue and their attendance is reset to `Pending`.
- Waitlist positions are calculated against every queued student for the event.
- Event capacity cannot be reduced below its number of confirmed registrations.

## Technology Stack

- **Frontend:** React, Vite, JavaScript, Axios, HTML, CSS
- **Backend:** Node.js, Express.js, JWT, bcryptjs
- **Database:** MongoDB Atlas with Mongoose
- **Authentication:** JWT-based authentication with role-based authorization

## Project Structure

```text
Event-Management-System/
├── client/
│   ├── src/
│   │   ├── pages/                 Student and admin dashboards
│   │   ├── App.jsx                Login, registration, and role-based routing
│   │   ├── App.css                Application and dashboard styles
│   │   └── index.css              Global styles
│   └── package.json
│
├── server/
│   ├── config/                    MongoDB connection
│   ├── controllers/               Authentication, event, registration logic
│   ├── middleware/                JWT and role protection
│   ├── models/                    User, Event, Registration, Waitlist schemas
│   ├── routes/                    Authentication, event, registration APIs
│   ├── server.js                  Express application entry point
│   └── package.json
│
├── .gitignore
└── README.md
```

## API Endpoints

All endpoints are under `/api`. Protected requests use:

```text
Authorization: Bearer <token>
```

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account with a student or admin role |
| POST | `/auth/login` | Public | Log in and receive a JWT |
| GET | `/events` | Authenticated | List events with capacity, confirmed seats, available seats, waitlist count, and Pending attendance count |
| GET | `/events/:id` | Authenticated | Get one event with seat and summary counts |
| POST | `/events` | Admin | Create an event |
| PUT | `/events/:id` | Admin | Edit an event |
| DELETE | `/events/:id` | Admin | Delete an event and its registrations/waitlist |
| POST | `/registrations` | Student | Register for an event |
| POST | `/registrations/waitlist` | Student | Join a full event's waitlist |
| DELETE | `/registrations/event/:eventId` | Student | Cancel a confirmed registration and promote the queue head |
| GET | `/registrations/my` | Student | List confirmed registrations |
| GET | `/registrations/my/waitlist` | Student | List waitlisted events with current positions |
| GET | `/registrations/event/:eventId` | Admin | List confirmed attendees and attendance |
| GET | `/registrations/event/:eventId/waitlist` | Admin | List waitlisted students in FIFO order |
| PUT | `/registrations/:registrationId/attendance` | Admin | Set attendance to `Attended` or `Absent` |

## Environment Variables

### Backend

Create `server/.env` locally.

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=<long-random-secret>
PORT=5000
```

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign JWT authentication tokens |
| `PORT` | Port used by the Express API; defaults to `5000` |

### Frontend

The frontend can optionally use `client/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

If it is omitted, the frontend uses `http://localhost:5000/api` for local development.

**Security:** Never commit `server/.env`, `client/.env.local`, database passwords, JWT secrets, API keys, or other private credentials. Environment files are excluded by `.gitignore`.

## Local Installation

### Requirements

- Node.js and npm
- MongoDB Atlas account and connection string
- Git

### 1. Clone the repository

```bash
git clone https://github.com/manicpsycho0207/Event-Management-System.git
cd Event-Management-System
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=<long-random-secret>
PORT=5000
```

Start the backend:

```bash
npm run dev
```

The local API runs on:

```text
http://localhost:5000
```

### 3. Configure the frontend

Open another terminal:

```bash
cd client
npm install
```

Optional `client/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start Vite:

```bash
npm run dev
```

Open the local URL shown by Vite, normally:

```text
http://localhost:5173
```

## Production Deployment

The application is structured for a separate frontend/backend deployment:

```text
                  ┌──────────────────────┐
                  │   Vercel             │
                  │   React + Vite       │
                  └──────────┬───────────┘
                             │ HTTPS API
                             ▼
                  ┌──────────────────────┐
                  │   Render             │
                  │   Node + Express     │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   MongoDB Atlas      │
                  │   Database           │
                  └──────────────────────┘
```

### Backend Deployment — Render

Create a **Web Service** in Render and connect this GitHub repository.

Use:

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Add the backend environment variables in Render:

```text
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<strong random secret>
PORT=<Render-provided port, if required by the platform>
```

Do not place real credentials in this README or in the GitHub repository.

After deployment, Render will provide a backend URL similar to:

```text
https://your-backend-name.onrender.com
```

### Frontend Deployment — Vercel

Create a Vercel project from the same GitHub repository.

Use:

| Setting | Value |
|---|---|
| Root Directory | `client` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Add this Vercel environment variable:

```text
VITE_API_URL=https://your-backend-name.onrender.com/api
```

Replace the example Render URL with the actual deployed backend URL.

After deployment, Vercel will provide the public frontend URL.

### Deployment URLs

Fill these in after deployment:

```text
Frontend:
https://<your-vercel-domain>

Backend:
https://<your-render-domain>

GitHub:
https://github.com/manicpsycho0207/Event-Management-System
```

## Waitlist Logic

1. Students receive confirmed registration while seats are available.
2. When capacity is reached, students can join the waitlist.
3. Waitlist entries are ordered by `joinedAt`, producing a FIFO queue.
4. When a confirmed attendee cancels, the earliest waitlisted student is automatically promoted.
5. The promoted student is removed from the waitlist and receives `Pending` attendance.
6. Remaining waitlisted students move up and receive updated positions.
7. If the queue is empty, the cancelled seat becomes available.

## Attendance

Every new or promoted confirmed registration starts with `Pending` attendance.

An administrator can update confirmed attendees to:

- `Attended`
- `Absent`

The attendance value is stored with the registration and is displayed in the appropriate dashboard views.

## Authentication and Authorization

The application uses JWT authentication.

Two roles are supported:

- **Admin** — event management, attendee/waitlist viewing, and attendance management.
- **Student** — event browsing, registration, waitlist, cancellation, and status viewing.

Passwords are hashed using `bcryptjs`.

## Test Credentials

The following credentials were used as local/demo assessment credentials:

- **Admin:** `admin@test.com` / `admin123`
- **Student:** `student@test.com` / `student123`

These accounts are database-dependent and may not exist in a fresh MongoDB database.

For a production deployment, use newly created accounts and do not rely on demo credentials.

## Validation and Testing

Before submission or deployment, verify:

### Frontend

```bash
cd client
npm run lint
npm run build
```

### Core A4 workflow

Test with one admin account and at least two student accounts:

1. Create an event with limited capacity.
2. Register students until the event is full.
3. Add students to the waitlist.
4. Verify FIFO waitlist order.
5. Attempt duplicate registration/waitlist actions.
6. Cancel a confirmed registration.
7. Verify the first waitlisted student is automatically promoted.
8. Verify remaining waitlist positions shift correctly.
9. Mark an attendee as `Attended` or `Absent`.
10. Refresh and verify that the saved status remains correct.

## Security Notes

- Secrets are supplied through environment variables.
- `.env` files must not be committed.
- MongoDB credentials must never be placed in source code or README files.
- JWT secrets should be long, random, and different between development and production.
- Production deployments should use HTTPS URLs for the frontend and backend.

## Assessment Scope

This project focuses on:

- Role-based authentication
- College event management
- Student event registration
- Capacity management
- FIFO event waitlists
- Automatic waitlist promotion after cancellation
- Attendance management

The following are intentionally outside the assessment scope:

- Payment processing
- Ticketing
- Certificate generation
- Complex multi-day event scheduling

## Repository

GitHub repository:

https://github.com/manicpsycho0207/Event-Management-System

## Project Status

**Assessment:** A4 — Event Registration with Waitlist  
**Status:** Ready for deployment and final submission
