const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Waitlist = require("../models/Waitlist");
const mongoose = require("mongoose");

// Register a student for an event
const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required"
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Check whether the student is already registered
        const existingRegistration = await Registration.findOne({
            event: event._id,
            student: req.user.id
        });

        if (
            existingRegistration &&
            existingRegistration.status === "confirmed"
        ) {
            return res.status(400).json({
                message: "You are already registered for this event"
            });
        }

        // Check whether the student is already on the waitlist
        const existingWaitlist = await Waitlist.findOne({
            event: event._id,
            student: req.user.id
        });

        if (existingWaitlist) {
            return res.status(400).json({
                message: "You are already on the waitlist for this event"
            });
        }

        // Count only confirmed registrations
        const registrationCount = await Registration.countDocuments({
            event: event._id,
            status: "confirmed"
        });

        // Event is full
        if (registrationCount >= event.maxCapacity) {
            return res.status(400).json({
                message: "Event is full. Please join the waitlist."
            });
        }

        // If a previous cancelled registration exists,
        // reuse that registration record.
        if (existingRegistration) {
            existingRegistration.status = "confirmed";
            existingRegistration.attendance = "Pending";
            existingRegistration.registeredAt = new Date();
            existingRegistration.cancelledAt = null;

            await existingRegistration.save();

            return res.status(201).json({
                message: "Event registration successful",
                status: "confirmed",
                availableSeats:
                    event.maxCapacity - (registrationCount + 1)
            });
        }

        // Create new confirmed registration
        const registration = await Registration.create({
            event: event._id,
            student: req.user.id,
            status: "confirmed",
            attendance: "Pending"
        });

        const availableSeats =
            event.maxCapacity - (registrationCount + 1);

        res.status(201).json({
            message: "Event registration successful",
            status: "confirmed",
            registration: {
                id: registration._id,
                event: event._id,
                student: req.user.id,
                registeredAt: registration.registeredAt
            },
            availableSeats
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "You are already registered for this event"
            });
        }

        console.error("Event registration error:", error.message);

        res.status(500).json({
            message: "Server error while registering for event"
        });
    }
};


// Join the waitlist
const joinWaitlist = async (req, res) => {
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required"
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Check if already registered
        const existingRegistration = await Registration.findOne({
            event: event._id,
            student: req.user.id,
            status: "confirmed"
        });

        if (existingRegistration) {
            return res.status(400).json({
                message: "You are already registered for this event"
            });
        }

        // Check if already on waitlist
        const existingWaitlist = await Waitlist.findOne({
            event: event._id,
            student: req.user.id
        });

        if (existingWaitlist) {
            return res.status(400).json({
                message: "You are already on the waitlist"
            });
        }

        // Count confirmed registrations
        const registrationCount = await Registration.countDocuments({
            event: event._id,
            status: "confirmed"
        });

        // Do not allow waitlist when a seat is available
        if (registrationCount < event.maxCapacity) {
            return res.status(400).json({
                message:
                    "Seats are available. Please register directly."
            });
        }

        // Add student to waitlist
        const waitlistEntry = await Waitlist.create({
            event: event._id,
            student: req.user.id
        });

        // Get current position
        const earlierEntries = await Waitlist.countDocuments({
            event: event._id,
            $or: [
                { joinedAt: { $lt: waitlistEntry.joinedAt } },
                {
                    joinedAt: waitlistEntry.joinedAt,
                    _id: { $lte: waitlistEntry._id }
                }
            ]
        });

        res.status(201).json({
            message: "Successfully joined the waitlist",
            status: "waitlisted",
            position: earlierEntries
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "You are already on the waitlist"
            });
        }

        console.error("Join waitlist error:", error.message);

        res.status(500).json({
            message: "Server error while joining waitlist"
        });
    }
};


// Cancel a student's confirmed registration
const cancelRegistration = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const registration = await Registration.findOne({
                event: req.params.eventId,
                student: req.user.id,
                status: "confirmed"
            }).session(session);

            if (!registration) {
                const error = new Error("Confirmed registration not found");
                error.statusCode = 404;
                throw error;
            }

            const event = await Event.findById(registration.event).session(session);

            if (!event) {
                const error = new Error("Event not found");
                error.statusCode = 404;
                throw error;
            }

            registration.status = "cancelled";
            registration.attendance = "Pending";
            registration.cancelledAt = new Date();
            await registration.save({ session });

            // Atomically take the earliest queue entry, preserving FIFO order.
            const nextStudent = await Waitlist.findOneAndDelete({
                event: event._id
            })
                .sort({ joinedAt: 1, _id: 1 })
                .session(session);

            if (nextStudent) {
                let promotedRegistration = await Registration.findOne({
                    event: event._id,
                    student: nextStudent.student
                }).session(session);

                if (promotedRegistration) {
                    promotedRegistration.status = "confirmed";
                    promotedRegistration.attendance = "Pending";
                    promotedRegistration.registeredAt = new Date();
                    promotedRegistration.cancelledAt = null;
                    await promotedRegistration.save({ session });
                } else {
                    [promotedRegistration] = await Registration.create([{
                        event: event._id,
                        student: nextStudent.student,
                        status: "confirmed",
                        attendance: "Pending"
                    }], { session });
                }

                result = {
                    message: "Registration cancelled and the next waitlisted student was promoted",
                    promotedStudent: nextStudent.student
                };
                return;
            }

            result = { message: "Registration cancelled successfully" };
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error(
            "Cancel registration error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Server error while cancelling registration"
        });
    } finally {
        await session.endSession();
    }
};


// Get registrations of the logged-in student
const getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({
            student: req.user.id,
            status: "confirmed"
        })
            .populate(
                "event",
                "name date time maxCapacity"
            )
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


// Get student's waitlist entries
const getMyWaitlist = async (req, res) => {
    try {
        const waitlistEntries = await Waitlist.find({
            student: req.user.id
        })
            .populate(
                "event",
                "name date time maxCapacity"
            )
            .sort({ joinedAt: 1, _id: 1 });

        const eventIds = [
            ...new Set(
                waitlistEntries.map((entry) => String(entry.event._id))
            )
        ];

        const queueEntries = await Waitlist.find({
            event: { $in: eventIds }
        })
            .sort({ event: 1, joinedAt: 1, _id: 1 })
            .select("_id event");

        const positions = new Map();
        const eventPositions = new Map();

        queueEntries.forEach((entry) => {
            const eventId = String(entry.event);
            const position = (eventPositions.get(eventId) || 0) + 1;
            eventPositions.set(eventId, position);
            positions.set(String(entry._id), position);
        });

        res.status(200).json({
            waitlistEntries: waitlistEntries.map((entry) => ({
                ...entry.toObject(),
                position: positions.get(String(entry._id))
            }))
        });
    } catch (error) {
        console.error(
            "Get my waitlist error:",
            error.message
        );

        res.status(500).json({
            message: "Server error while fetching waitlist"
        });
    }
};


// Get registrations for an event
// Admin only
const getEventRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({
            event: req.params.eventId,
            status: "confirmed"
        })
            .populate("student", "name email")
            .populate(
                "event",
                "name date time"
            )
            .sort({ registeredAt: 1 });

        res.status(200).json({
            registrations
        });
    } catch (error) {
        console.error(
            "Get event registrations error:",
            error.message
        );

        res.status(500).json({
            message:
                "Server error while fetching registrations"
        });
    }
};


// Get waitlisted students for an event
// Admin only
const getEventWaitlist = async (req, res) => {
    try {
        const waitlistEntries = await Waitlist.find({
            event: req.params.eventId
        })
            .populate("student", "name email")
            .populate(
                "event",
                "name date time"
            )
            .sort({ joinedAt: 1, _id: 1 });

        res.status(200).json({
            waitlistEntries: waitlistEntries.map((entry, index) => ({
                ...entry.toObject(),
                position: index + 1
            }))
        });
    } catch (error) {
        console.error(
            "Get event waitlist error:",
            error.message
        );

        res.status(500).json({
            message:
                "Server error while fetching waitlist"
        });
    }
};


// Mark attendance
// Admin only
const markAttendance = async (req, res) => {
    try {
        const { attendance } = req.body;

        if (!["Attended", "Absent"].includes(attendance)) {
            return res.status(400).json({
                message:
                    "Attendance must be either Attended or Absent"
            });
        }

        const registration = await Registration.findOne({
            _id: req.params.registrationId,
            status: "confirmed"
        });

        if (!registration) {
            return res.status(404).json({
                message: "Confirmed registration not found"
            });
        }

        registration.attendance = attendance;

        await registration.save();

        res.status(200).json({
            message: `Attendance marked as ${attendance}`,
            registration
        });
    } catch (error) {
        console.error(
            "Mark attendance error:",
            error.message
        );

        res.status(500).json({
            message:
                "Server error while marking attendance"
        });
    }
};


module.exports = {
    registerForEvent,
    joinWaitlist,
    cancelRegistration,
    getMyRegistrations,
    getMyWaitlist,
    getEventRegistrations,
    getEventWaitlist,
    markAttendance
};