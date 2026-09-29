const jwt = require("jsonwebtoken");

// Verify JWT token
const protect = (req, res, next) => {
    try {
        // Get Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized. Token is required."
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "event_management_secret"
        );

        // Store user information in request
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Not authorized. Invalid or expired token."
        });
    }
};

// Check whether logged-in user is an admin
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({
            message: "Access denied. Admin only."
        });
    }
};

// Check whether logged-in user is a student
const studentOnly = (req, res, next) => {
    if (req.user && req.user.role === "student") {
        next();
    } else {
        return res.status(403).json({
            message: "Access denied. Student only."
        });
    }
};

module.exports = {
    protect,
    adminOnly,
    studentOnly
};