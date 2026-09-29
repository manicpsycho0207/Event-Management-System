# Event Management System

## Overview

A role-based college event management system. Administrators create and manage events, while students browse upcoming events, register for available seats, and join a First-Come, First-Served (FIFO) waitlist when an event is full.

## Features

### Admin
- Log in and manage events: create, edit, and delete.
- View confirmed attendees, event capacity, and available seats.
- View waitlisted students in FIFO order.
- Mark confirmed attendees as Attended or Absent.

### Student
- Register and log in.
- Browse upcoming events and see date, time, capacity, confirmed registrations, and available seats.
- Register while a seat is available or join the waitlist when full.
- View registration status, attendance status, and actual FIFO waitlist position.
- Cancel a confirmed registration and see current registrations and waitlist entries.

New registrations and promoted students have Pending attendance by default.

### Registration rules
- Only `confirmed` registrations count toward event capacity; cancelled registrations and waitlist entries do not.
- A student cannot register twice, join a waitlist while registered, join the same waitlist twice, or join a waitlist while seats remain.
- Each queue entry stores `joinedAt`; queue operations sort by `joinedAt` and use the entry ID as a deterministic tie-breaker.
- Cancelling a confirmed registration and promoting the oldest waitlisted student are performed in one MongoDB transaction. The promoted student is removed from the queue and their attendance is reset to Pending.
- Waitlist positions are calculated against every queued student for the event, not only the logged-in student's entries.
- Event capacity cannot be reduced below its number of confirmed registrations.

## Technology stack

- **Frontend:** React, Vite, JavaScript, Axios, HTML, CSS
- **Backend:** Node.js, Express.js, JWT, bcryptjs
- **Database:** MongoDB Atlas with Mongoose

## Project structure

```text
client/
   src/
      pages/                 Student and admin dashboards
      App.jsx                Login, registration, and role-based dashboard routing
      App.css                Application and dashboard styles
      index.css              Global styles
   package.json
server/
   config/                  MongoDB connection
   controllers/             Authentication, event, and registration logic
   middleware/              JWT and role protection
   models/                  User, Event, Registration, and Waitlist schemas
   routes/                  Authentication, event, and registration APIs
   server.js                Express application entry point
   package.json
README.md
```

## API endpoints

All endpoints are under `/api`. Protected requests use `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create an account with a student or admin role |
| POST | `/auth/login` | Public | Log in and receive a JWT |
| GET | `/events` | Authenticated | List events with capacity, confirmed seats, available seats, waitlist count, and Pending attendance count |
| GET | `/events/:id` | Authenticated | Get one event with the same seat and summary counts |
| POST | `/events` | Admin | Create an event |
| PUT | `/events/:id` | Admin | Edit an event |
| DELETE | `/events/:id` | Admin | Delete an event and its registrations/waitlist |
| POST | `/registrations` | Student | Register for an event (`{ "eventId": "..." }`) |
| POST | `/registrations/waitlist` | Student | Join a full event's waitlist (`{ "eventId": "..." }`) |
| DELETE | `/registrations/event/:eventId` | Student | Cancel a confirmed registration and promote the queue head |
| GET | `/registrations/my` | Student | List confirmed registrations |
| GET | `/registrations/my/waitlist` | Student | List waitlisted events with current positions |
| GET | `/registrations/event/:eventId` | Admin | List confirmed attendees and attendance |
| GET | `/registrations/event/:eventId/waitlist` | Admin | List waitlisted students in FIFO order |
| PUT | `/registrations/:registrationId/attendance` | Admin | Set attendance to `Attended` or `Absent` |

## Environment variables

Set these values in `server/.env`; do not commit that file or put real credentials in this README.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long, randomly generated JWT signing secret |
| `PORT` | API port (defaults to `5000`) |

The frontend optionally accepts `VITE_API_URL` in `client/.env.local`, defaulting to `http://localhost:5000/api`.

## Installation

### Requirements
- Node.js and npm
- A MongoDB Atlas connection string (or another MongoDB deployment that supports transactions)

### Backend
1. In `server/`, install dependencies with `npm install`.
2. Create `server/.env` with:

   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
   JWT_SECRET=<long-random-secret>
   PORT=5000
   ```

3. Start the API from `server/` with `npm run dev`. The default API address is `http://localhost:5000`.

### Frontend
1. In `client/`, install dependencies with `npm install`.
2. Optionally create `client/.env.local` to configure the API root:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

   The same API root is used for login, events, registration, waitlist, and attendance requests. If omitted, the frontend defaults to `http://localhost:5000/api`.
3. Start Vite from `client/` with `npm run dev` and open the URL it prints (normally `http://localhost:5173`).

JWTs are stored under the `eventManagementToken` local-storage key. The `.gitignore` excludes `.env` and `.env.*` files (except `.env.example` templates); never commit database credentials or JWT secrets.

## Waitlist Logic

1. Students receive confirmed registration while seats are available.
2. When capacity is reached, students can join the waitlist instead of registering.
3. Entries are ordered by `joinedAt` and FIFO position is calculated against all waiting students for the event.
4. When a confirmed attendee cancels, the earliest waitlisted student is promoted automatically in a MongoDB transaction and removed from the queue.
5. Remaining students move up and receive updated positions. If the queue is empty, the cancelled seat becomes available.

## Attendance

Every new or promoted confirmed registration starts with `Pending` attendance. An administrator can update confirmed attendees to `Attended` or `Absent`; the current value appears on the student registration list and the admin attendee table.

## Test credentials

The README previously listed these local/demo credentials. They are not guaranteed to exist in a given database; register the accounts if needed.

- **Admin:** `admin@test.com` / `admin123`
- **Student:** `student@test.com` / `student123`

Use only for local/demo assessment data. Change or remove demo credentials before deployment.

## Useful checks

- Frontend production build: run `npm run build` in `client/`.
- Frontend lint: run `npm run lint` in `client/`.
- Verify the core workflow with at least two student accounts and one admin: register to capacity, add two waitlist entries, cancel a confirmed registration, then confirm the oldest student was promoted and the remaining queue position shifted.

## Assessment scope

This project focuses on event registration, FIFO waitlists, role-based event management, and attendance. Payment processing, ticketing, certificate generation, and complex multi-day scheduling are outside the assessment scope.