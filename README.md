# College Event Management System

A full-stack event management application for college administrators and students. Administrators create events and manage attendees; students register for available seats or join a first-in, first-out (FIFO) waitlist.

## Features

### Admin
- Create, edit, and delete events.
- View capacity, confirmed registration count, and available seats.
- View confirmed attendees and waitlisted students in join order.
- Mark confirmed attendees as Attended or Absent. New registrations and waitlist promotions start as Pending.

### Student
- Browse events and see capacity, confirmed seats, and remaining seats.
- Register while a seat is available; join the waitlist only when the event is full.
- View active registrations and waitlist entries, including current queue position.
- Cancel a confirmed registration. The first waitlisted student is promoted automatically.

### Registration and waitlist rules
- Only `confirmed` registrations count toward event capacity; cancelled registrations and waitlist entries do not.
- A student cannot register twice, join a waitlist while registered, join the same waitlist twice, or join a waitlist while seats remain.
- Each queue entry stores `joinedAt`; queue operations sort by `joinedAt` and use the entry ID as a deterministic tie-breaker.
- Cancelling a confirmed registration and promoting the oldest waitlisted student are performed in one MongoDB transaction. The promoted student is removed from the queue and their attendance is reset to Pending.
- Waitlist positions are calculated against every queued student for the event, not only the logged-in student's entries.
- Event capacity cannot be reduced below its number of confirmed registrations.

## Technology stack

- **Frontend:** React, Vite, JavaScript, Axios, CSS
- **Backend:** Node.js, Express.js, JWT, bcryptjs
- **Database:** MongoDB Atlas with Mongoose

## API endpoints

All endpoints are under `/api`. Protected requests use `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create an account with a student or admin role |
| POST | `/auth/login` | Public | Log in and receive a JWT |
| GET | `/events` | Authenticated | List events with `maxCapacity`, `registeredSeats`, and `availableSeats` |
| GET | `/events/:id` | Authenticated | Get one event with seat counts |
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

## Local setup

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

## FIFO promotion flow

When a student cancels, the API marks their registration cancelled and selects the queue entry with the earliest `joinedAt` (stable ID tie-breaker). In a database transaction, that student is promoted to a confirmed registration with Pending attendance and removed from the waitlist. The next student's displayed position then moves up automatically. If the queue is empty, the seat remains available.

## Test credentials

The README previously listed these local/demo credentials. They are not guaranteed to exist in a given database; register the accounts if needed.

- **Admin:** `admin@test.com` / `admin123`
- **Student:** `student@test.com` / `student123`

Use only for local/demo assessment data. Change or remove demo credentials before deployment.

## Useful checks

- Frontend production build: run `npm run build` in `client/`.
- Frontend lint: run `npm run lint` in `client/`.
- Verify the core workflow with at least two student accounts and one admin: register to capacity, add two waitlist entries, cancel a confirmed registration, then confirm the oldest student was promoted and the remaining queue position shifted.