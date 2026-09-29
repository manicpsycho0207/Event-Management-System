const express = require("express");

const {
    registerForEvent,
    joinWaitlist,
    cancelRegistration,
    getMyRegistrations,
    getMyWaitlist,
    getEventRegistrations,
    getEventWaitlist,
    markAttendance
} = require("../controllers/registrationController");

const {
    protect,
    adminOnly,
    studentOnly
} = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// STUDENT ROUTES
// ==========================================

// Register directly for an event
router.post(
    "/",
    protect,
    studentOnly,
    registerForEvent
);


// Join waitlist when event is full
router.post(
    "/waitlist",
    protect,
    studentOnly,
    joinWaitlist
);


// Cancel confirmed registration
router.delete(
    "/event/:eventId",
    protect,
    studentOnly,
    cancelRegistration
);


// Get logged-in student's confirmed registrations
router.get(
    "/my",
    protect,
    studentOnly,
    getMyRegistrations
);


// Get logged-in student's waitlist entries
router.get(
    "/my/waitlist",
    protect,
    studentOnly,
    getMyWaitlist
);


// ==========================================
// ADMIN ROUTES
// ==========================================

// View confirmed attendees of an event
router.get(
    "/event/:eventId",
    protect,
    adminOnly,
    getEventRegistrations
);


// View waitlisted students of an event
router.get(
    "/event/:eventId/waitlist",
    protect,
    adminOnly,
    getEventWaitlist
);


// Mark attendee attendance
router.put(
    "/:registrationId/attendance",
    protect,
    adminOnly,
    markAttendance
);


module.exports = router;