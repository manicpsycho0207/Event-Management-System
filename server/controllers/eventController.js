const Event = require("../models/Event");
const Registration = require("../models/Registration");

// Create a new event
const createEvent = async (req, res) => {
    try {
        const { name, date, time, maxCapacity } = req.body;

        // Validate required fields
        if (!name || !date || !time || maxCapacity === undefined) {
            return res.status(400).json({
                message: "Name, date, time and maximum capacity are required"
            });
        }

        // Validate capacity
        if (!Number.isInteger(Number(maxCapacity)) || Number(maxCapacity) < 1) {
            return res.status(400).json({
                message: "Maximum capacity must be a whole number greater than 0"
            });
        }

        // Create event
        const event = await Event.create({
            name: name.trim(),
            date,
            time,
            maxCapacity: Number(maxCapacity),
            createdBy: req.user.id
        });

        res.status(201).json({
            message: "Event created successfully",
            event
        });
    } catch (error) {
        console.error("Create event error:", error.message);

        res.status(500).json({
            message: "Server error while creating event"
        });
    }
};

// Get all upcoming events
const getEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate("createdBy", "name email")
            .sort({ date: 1, time: 1 });

        // Calculate available seats for every event
        const eventsWithSeats = await Promise.all(
            events.map(async (event) => {
                const registrationCount = await Registration.countDocuments({
                    event: event._id
                });

                const availableSeats =
                    event.maxCapacity - registrationCount;

                return {
                    _id: event._id,
                    name: event.name,
                    date: event.date,
                    time: event.time,
                    maxCapacity: event.maxCapacity,
                    registeredSeats: registrationCount,
                    availableSeats: Math.max(availableSeats, 0),
                    createdBy: event.createdBy
                };
            })
        );

        res.status(200).json({
            events: eventsWithSeats
        });
    } catch (error) {
        console.error("Get events error:", error.message);

        res.status(500).json({
            message: "Server error while fetching events"
        });
    }
};

// Get a single event
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate("createdBy", "name email");

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        const registrationCount = await Registration.countDocuments({
            event: event._id
        });

        const availableSeats =
            event.maxCapacity - registrationCount;

        res.status(200).json({
            event: {
                _id: event._id,
                name: event.name,
                date: event.date,
                time: event.time,
                maxCapacity: event.maxCapacity,
                registeredSeats: registrationCount,
                availableSeats: Math.max(availableSeats, 0),
                createdBy: event.createdBy
            }
        });
    } catch (error) {
        console.error("Get event error:", error.message);

        res.status(500).json({
            message: "Server error while fetching event"
        });
    }
};

// Update an event
const updateEvent = async (req, res) => {
    try {
        const { name, date, time, maxCapacity } = req.body;

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Count existing registrations
        const registrationCount = await Registration.countDocuments({
            event: event._id
        });

        // If capacity is being changed, it cannot be lower
        // than the number of students already registered
        if (
            maxCapacity !== undefined &&
            Number(maxCapacity) < registrationCount
        ) {
            return res.status(400).json({
                message:
                    `Maximum capacity cannot be less than current registrations (${registrationCount})`
            });
        }

        // Validate capacity if provided
        if (
            maxCapacity !== undefined &&
            (!Number.isInteger(Number(maxCapacity)) ||
                Number(maxCapacity) < 1)
        ) {
            return res.status(400).json({
                message: "Maximum capacity must be a whole number greater than 0"
            });
        }

        // Update only provided fields
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    message: "Event name cannot be empty"
                });
            }

            event.name = name.trim();
        }

        if (date !== undefined) {
            event.date = date;
        }

        if (time !== undefined) {
            event.time = time;
        }

        if (maxCapacity !== undefined) {
            event.maxCapacity = Number(maxCapacity);
        }

        await event.save();

        res.status(200).json({
            message: "Event updated successfully",
            event
        });
    } catch (error) {
        console.error("Update event error:", error.message);

        res.status(500).json({
            message: "Server error while updating event"
        });
    }
};

// Delete an event
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Delete registrations belonging to this event
        await Registration.deleteMany({
            event: event._id
        });

        // Delete the event
        await Event.findByIdAndDelete(event._id);

        res.status(200).json({
            message: "Event and its registrations deleted successfully"
        });
    } catch (error) {
        console.error("Delete event error:", error.message);

        res.status(500).json({
            message: "Server error while deleting event"
        });
    }
};

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent
};