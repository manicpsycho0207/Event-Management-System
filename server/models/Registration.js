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

        registeredAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Prevent the same student from registering
// for the same event more than once.
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