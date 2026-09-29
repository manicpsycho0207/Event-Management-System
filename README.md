# Event Management System

A modern full-stack college event management platform built with React, Node.js, Express, and MongoDB. The application provides separate experiences for administrators and students, making it easy to create events, manage registrations, handle capacity limits, maintain a FIFO waitlist, and track attendance.

## Overview

The Event Management System is designed to simplify the complete event registration workflow for colleges and institutions.

Administrators can create and manage events, monitor registrations and waitlists, and record attendance. Students can discover available events, register for seats, join a waitlist when an event is full, cancel registrations, and track their current status.

The system automatically handles waitlist promotion whenever a confirmed attendee cancels.

## Features

### Student

- Create an account and log in securely
- Browse available events
- View event date, time, capacity, and available seats
- Register for events with available seats
- Join the waitlist when an event reaches capacity
- View confirmed registrations
- View current FIFO waitlist position
- Cancel a confirmed registration
- Automatically receive a confirmed seat when promoted from the waitlist
- View attendance status

### Administrator

- Secure administrator login
- Create new events
- Edit existing events
- Delete events
- View confirmed attendees
- View waitlisted students in FIFO order
- Monitor event capacity and available seats
- Mark attendees as **Attended** or **Absent**

## Registration & Waitlist

The registration system follows a simple first-come, first-served approach.

1. If seats are available, a student receives a confirmed registration.
2. Once an event reaches its capacity, new students can join the waitlist.
3. Waitlist entries are maintained in FIFO order.
4. When a confirmed student cancels, the earliest waitlisted student is automatically promoted.
5. The promoted student is removed from the waitlist and receives a confirmed registration.
6. Remaining students automatically move forward in the queue.
7. Cancelled registrations do not count toward event capacity.

This process is handled by the backend so that the registration and waitlist state remains consistent.

## Attendance

Every confirmed registration starts with a **Pending** attendance status.

Administrators can update the status to:

- **Attended**
- **Absent**

Attendance information is stored with the registration and remains available after refreshing the application.

## Authentication & Authorization

The application uses JWT-based authentication with role-based access control.

### Admin

Administrators have access to:

- Event management
- Attendee management
- Waitlist management
- Attendance management

### Student

Students have access to:

- Event browsing
- Event registration
- Waitlist
- Registration cancellation
- Registration and attendance status

Passwords are securely hashed using `bcryptjs`.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, JavaScript, Axios |
| Styling | CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT |
| Password Security | bcryptjs |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git & GitHub |

## Project Architecture

```text
                         ┌─────────────────────────┐
                         │        Vercel           │
                         │    React + Vite App     │
                         └────────────┬────────────┘
                                      │
                                      │ HTTPS / REST API
                                      ▼
                         ┌─────────────────────────┐
                         │        Render           │
                         │   Node + Express API    │
                         └────────────┬────────────┘
                                      │
                                      │ Mongoose
                                      ▼
                         ┌─────────────────────────┐
                         │      MongoDB Atlas      │
                         │       Database          │
                         └─────────────────────────┘
```

## Project Structure

```text
Event-Management-System/
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── StudentDashboard.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## API

The backend provides RESTful API endpoints for authentication, events, registrations, waitlists, and attendance.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Authenticate a user |

### Events

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | Get available events |
| GET | `/api/events/:id` | Get a specific event |
| POST | `/api/events` | Create an event |
| PUT | `/api/events/:id` | Update an event |
| DELETE | `/api/events/:id` | Delete an event |

### Registrations & Waitlist

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/registrations` | Register for an event |
| POST | `/api/registrations/waitlist` | Join an event waitlist |
| DELETE | `/api/registrations/event/:eventId` | Cancel registration |
| GET | `/api/registrations/my` | View confirmed registrations |
| GET | `/api/registrations/my/waitlist` | View waitlisted events |
| GET | `/api/registrations/event/:eventId` | View event attendees |
| GET | `/api/registrations/event/:eventId/waitlist` | View event waitlist |
| PUT | `/api/registrations/:registrationId/attendance` | Update attendance |

Protected endpoints require a JWT:

```text
Authorization: Bearer <token>
```

## Environment Variables

### Backend

Create `server/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=<your-secret>
PORT=5000
CLIENT_URL=http://localhost:5173
```

For the production deployment, these values are configured through the Render environment settings.

### Frontend

For local development, create `client/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

For production, the frontend uses the deployed Render API:

```env
VITE_API_URL=https://event-management-system-u12s.onrender.com/api
```

> Never commit passwords, database credentials, JWT secrets, or other private environment variables to GitHub.

## Run Locally

### Prerequisites

- Node.js
- npm
- MongoDB Atlas account
- Git

### 1. Clone the repository

```bash
git clone https://github.com/manicpsycho0207/Event-Management-System.git
cd Event-Management-System
```

### 2. Start the backend

```bash
cd server
npm install
npm run dev
```

The backend will run locally on:

```text
http://localhost:5000
```

### 3. Start the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

## Production Deployment

The application is currently deployed using:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

### Live Application

**Frontend:**  
https://event-management-system-flax-beta.vercel.app/

### Backend API

**API Base URL:**  
https://event-management-system-u12s.onrender.com/api

### Source Code

**GitHub:**  
https://github.com/manicpsycho0207/Event-Management-System

## Production Configuration

### Frontend — Vercel

```text
Root Directory: client
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

Production environment variable:

```text
VITE_API_URL=https://event-management-system-u12s.onrender.com/api
```

### Backend — Render

```text
Root Directory: server
Build Command: npm install
Start Command: npm start
```

Required environment variables:

```text
MONGODB_URI
JWT_SECRET
CLIENT_URL
```

MongoDB Atlas is used as the production database.

## Validation

The project was tested across the main application workflows, including:

- User registration and login
- Admin and student role access
- Event creation and editing
- Event capacity handling
- Direct event registration
- Waitlist registration
- FIFO waitlist ordering
- Duplicate registration prevention
- Duplicate waitlist prevention
- Registration cancellation
- Automatic waitlist promotion
- Multiple sequential cancellations
- Attendance updates
- Persistent MongoDB data
- Frontend production build
- Backend integration with MongoDB Atlas

Frontend checks:

```bash
cd client
npm run lint
npm run build
```

## Security

- JWT authentication is used for protected routes.
- Passwords are hashed using `bcryptjs`.
- Role-based authorization protects administrative operations.
- Database credentials are stored through environment variables.
- Production secrets are not stored in the repository.
- HTTPS is used for the deployed frontend and backend communication.

## Future Improvements

Possible future enhancements include:

- Email notifications for event registration and waitlist promotion
- Event search and filtering
- Profile management
- Event categories
- Admin analytics and reporting
- Calendar integration
- Improved notification system
- Cloud image storage for event posters

## License

This project is intended for educational and portfolio use.

## Author

**Parth Mahendra Lonkar**

Bachelor of Engineering — Information Technology  
Prof. Ram Meghe College of Engineering & Management, Badnera-Amravati

### Connect

GitHub:  
https://github.com/manicpsycho0207

---

## Project Status

**🟢 Deployed and Live**

**Live Application:**  
https://event-management-system-flax-beta.vercel.app/

**Backend API:**  
https://event-management-system-u12s.onrender.com/api

**Source Code:**  
https://github.com/manicpsycho0207/Event-Management-System

**Author:** Parth Mahendra Lonkar
