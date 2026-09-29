const Event = require("../models/Event");
const Registration = require("../models/Registration");

// Register a student for an event
const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.body;

        // Validate event ID
        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required"
            });
        }

        // Find event
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Check whether student has already registered
        const existingRegistration = await Registration.findOne({
            event: event._id,
            student: req.user.id
        });

        if (existingRegistration) {
            return res.status(400).json({
                message: "You have already registered for this event"
            });
        }

        // Count current registrations
        const registrationCount = await Registration.countDocuments({
            event: event._id
        });

        // Check whether event is full
        if (registrationCount >= event.maxCapacity) {
            return res.status(400).json({
                message: "Event is full. Registration is closed."
            });
        }

        // Create registration
        const registration = await Registration.create({
            event: event._id,
            student: req.user.id
        });

        // Calculate remaining seats
        const availableSeats =
            event.maxCapacity - (registrationCount + 1);

        res.status(201).json({
            message: "Event registration successful",
            registration: {
                id: registration._id,
                event: event._id,
                student: req.user.id,
                registeredAt: registration.registeredAt
            },
            availableSeats
        });
    } catch (error) {
        // Handle duplicate registration caused by
        // the database unique index
        if (error.code === 11000) {
            return res.status(400).json({
                message: "You have already registered for this event"
            });
        }

        console.error("Event registration error:", error.message);

        res.status(500).json({
            message: "Server error while registering for event"
        });
    }
};

// Get registrations for an event
// Admin only
const getEventRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({
            event: req.params.eventId
        })
            .populate("student", "name email")
            .populate("event", "name date time");

        res.status(200).json({
            registrations
        });
    } catch (error) {
        console.error(
            "Get event registrations error:",
            error.message
        );

        res.status(500).json({
            message: "Server error while fetching registrations"
        });
    }
};

// Get registrations of the logged-in student
const getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({
            student: req.user.id
        })
            .populate("event", "name date time maxCapacity")
            .sort({ registeredAt: -1 });

        res.status(200).json({
            registrations
        });
    } catch (error) {
        console.error(
            "Get my registrations error:",
            error.message
        );

        res.status(500).json({
            message: "Server error while fetching your registrations"
        });
    }
};

module.exports = {
    registerForEvent,
    getEventRegistrations,
    getMyRegistrations
};