const express = require("express");

const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent
} = require("../controllers/eventController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

// Get all events
// Accessible to logged-in users
router.get("/", protect, getEvents);

// Get a single event
// Accessible to logged-in users
router.get("/:id", protect, getEventById);

// Create event
// Admin only
router.post("/", protect, adminOnly, createEvent);

// Update event
// Admin only
router.put("/:id", protect, adminOnly, updateEvent);

// Delete event
// Admin only
router.delete("/:id", protect, adminOnly, deleteEvent);

module.exports = router;