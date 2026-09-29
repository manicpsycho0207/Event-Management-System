const mongoose = require("mongoose");

const waitlistSchema = new mongoose.Schema(
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

        joinedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Prevent the same student from joining
// the waitlist for the same event more than once.
waitlistSchema.index(
    {
        event: 1,
        student: 1
    },
    {
        unique: true
    }
);

// Keep queue lookups ordered by join time, with a stable tie-breaker.
waitlistSchema.index({
    event: 1,
    joinedAt: 1,
    _id: 1
});

const Waitlist = mongoose.model(
    "Waitlist",
    waitlistSchema
);

module.exports = Waitlist;