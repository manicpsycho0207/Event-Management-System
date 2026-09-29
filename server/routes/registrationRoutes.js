const express = require("express");

const {
    registerForEvent,
    getEventRegistrations,
    getMyRegistrations
} = require("../controllers/registrationController");

const {
    protect,
    adminOnly,
    studentOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

// Student registers for an event
router.post("/", protect, studentOnly, registerForEvent);

// Admin views attendees of an event
router.get(
    "/event/:eventId",
    protect,
    adminOnly,
    getEventRegistrations
);

// Student views their own registrations
router.get(
    "/my",
    protect,
    studentOnly,
    getMyRegistrations
);

module.exports = router;