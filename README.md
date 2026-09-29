# College Event Management System

A web-based College Event Management System that allows administrators to create and manage college events, while students can view upcoming events and register for them based on available seats.

## Features

### Authentication
- Student and Admin registration
- Student and Admin login
- JWT-based authentication
- Role-based access control

### Admin Dashboard
- View event statistics
- Create new events
- Edit existing events
- Delete events
- View registration and remaining-seat information
- View attendee lists for individual events

### Student Dashboard
- View upcoming college events
- View event date and time
- View maximum capacity
- View registered and available seats
- Register for events
- View personal registrations
- Prevent duplicate registration

### Business Rules
- Event name, date, time and maximum capacity are required
- Maximum capacity must be greater than zero
- Students cannot register for the same event more than once
- Registration is blocked when an event reaches its maximum capacity
- Available seats are calculated from the actual number of registrations

---

## Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- Axios
- HTML
- CSS

### Backend
- Node.js
- Express.js
- REST API
- JWT Authentication
- bcryptjs

### Database
- MongoDB
- Mongoose
- MongoDB Atlas

### Development Tools
- Visual Studio Code
- Git
- GitHub
- Postman / PowerShell for API testing

---

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
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   └── registrationController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── Registration.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── registrationRoutes.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md