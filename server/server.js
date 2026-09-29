const dns = require("dns");

// Use Google's DNS resolver for MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");

dotenv.config();

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is required to start the server.");
    process.exit(1);
}

const app = express();

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Event routes
app.use("/api/events", eventRoutes);

// Registration routes
app.use("/api/registrations", registrationRoutes);

// Server port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});