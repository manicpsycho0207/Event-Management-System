const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["confirmed", "cancelled"],
            default: "confirmed"
        },

        attendance: {
            type: String,
            enum: ["Pending", "Attended", "Absent"],
            default: "Pending"
        },

        registeredAt: {
            type: Date,
            default: Date.now
        },

        cancelledAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate active registrations.
// A student can have only one registration record
// for a particular event.
registrationSchema.index(
    {
        event: 1,
        student: 1
    },
    {
        unique: true
    }
);

const Registration = mongoose.model(
    "Registration",
    registrationSchema
);

module.exports = Registration;