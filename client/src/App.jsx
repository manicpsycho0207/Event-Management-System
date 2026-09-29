import { useState } from "react";
import axios from "axios";

import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import "./App.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

function App() {
    const storedUser = localStorage.getItem(
        "eventManagementUser"
    );

    const storedToken = localStorage.getItem(
        "eventManagementToken"
    );

    const [user, setUser] = useState(
        storedUser ? JSON.parse(storedUser) : null
    );

    const [token, setToken] = useState(storedToken);

    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState("student");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                const response = await axios.post(
                    `${API_URL}/auth/login`,
                    {
                        email: formData.email,
                        password: formData.password
                    }
                );

                const loginToken = response.data.token;
                const loggedInUser = response.data.user;

                localStorage.setItem(
                    "eventManagementToken",
                    loginToken
                );

                localStorage.setItem(
                    "eventManagementUser",
                    JSON.stringify(loggedInUser)
                );

                setToken(loginToken);
                setUser(loggedInUser);

                setFormData({
                    name: "",
                    email: "",
                    password: ""
                });
            } else {
                await axios.post(
                    `${API_URL}/auth/register`,
                    {
                        name: formData.name,
                        email: formData.email,
                        password: formData.password,
                        role
                    }
                );

                setMessage(
                    "Registration successful! You can now log in."
                );

                setIsLogin(true);

                setFormData({
                    name: "",
                    email: "",
                    password: ""
                });
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.message ||
                "Something went wrong. Please try again.";

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("eventManagementToken");
        localStorage.removeItem("eventManagementUser");

        setToken(null);
        setUser(null);

        setIsLogin(true);
        setRole("student");
        setMessage("");
        setError("");
    };

    // If the user is logged in, show the correct dashboard.
    if (user && token) {
        if (user.role === "admin") {
            return (
                <AdminDashboard
                    user={user}
                    onLogout={handleLogout}
                />
            );
        }

        return (
            <StudentDashboard
                user={user}
                onLogout={handleLogout}
            />
        );
    }

    // Otherwise show authentication screen.
    return (
        <div className="app">
            <div className="auth-container">

                {/* Left Side */}
                <div className="auth-info">

                    <div className="brand">
                        <div className="brand-icon">
                            🎓
                        </div>

                        <span>CampusEvents</span>
                    </div>

                    <div className="info-content">

                        <span className="eyebrow">
                            COLLEGE EVENT MANAGEMENT
                        </span>

                        <h1>
                            Discover.
                            <br />
                            Register.
                            <br />
                            <span>Experience.</span>
                        </h1>

                        <p>
                            A simple platform for managing college
                            events and connecting students with
                            exciting campus experiences.
                        </p>

                        <div className="feature-list">

                            <div className="feature-item">
                                <span className="feature-icon">
                                    📅
                                </span>

                                <div>
                                    <strong>
                                        Discover Events
                                    </strong>

                                    <small>
                                        Find upcoming college events
                                    </small>
                                </div>
                            </div>

                            <div className="feature-item">
                                <span className="feature-icon">
                                    🎟️
                                </span>

                                <div>
                                    <strong>
                                        Easy Registration
                                    </strong>

                                    <small>
                                        Reserve your seat in seconds
                                    </small>
                                </div>
                            </div>

                            <div className="feature-item">
                                <span className="feature-icon">
                                    👥
                                </span>

                                <div>
                                    <strong>
                                        Manage Everything
                                    </strong>

                                    <small>
                                        Admin tools for event
                                        management
                                    </small>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className="auth-panel">

                    <div className="auth-card">

                        <div className="auth-header">

                            <h2>
                                {isLogin
                                    ? "Welcome back!"
                                    : "Create your account"}
                            </h2>

                            <p>
                                {isLogin
                                    ? "Sign in to continue to CampusEvents"
                                    : "Join your college event community"}
                            </p>

                        </div>

                        {/* Login/Register Toggle */}
                        <div className="auth-toggle">

                            <button
                                type="button"
                                className={
                                    isLogin ? "active" : ""
                                }
                                onClick={() => {
                                    setIsLogin(true);
                                    setMessage("");
                                    setError("");
                                }}
                            >
                                Login
                            </button>

                            <button
                                type="button"
                                className={
                                    !isLogin ? "active" : ""
                                }
                                onClick={() => {
                                    setIsLogin(false);
                                    setMessage("");
                                    setError("");
                                }}
                            >
                                Register
                            </button>

                        </div>

                        {/* Role Selection */}
                        <div className="role-section">

                            <label>Continue as</label>

                            <div className="role-buttons">

                                <button
                                    type="button"
                                    className={
                                        role === "student"
                                            ? "role-button selected"
                                            : "role-button"
                                    }
                                    onClick={() =>
                                        setRole("student")
                                    }
                                >
                                    <span>🎓</span>
                                    Student
                                </button>

                                <button
                                    type="button"
                                    className={
                                        role === "admin"
                                            ? "role-button selected"
                                            : "role-button"
                                    }
                                    onClick={() =>
                                        setRole("admin")
                                    }
                                >
                                    <span>⚙️</span>
                                    Admin
                                </button>

                            </div>

                        </div>

                        <form onSubmit={handleSubmit}>

                            {!isLogin && (
                                <div className="form-group">

                                    <label htmlFor="name">
                                        Full Name
                                    </label>

                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>
                            )}

                            <div className="form-group">

                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label htmlFor="password">
                                    Password
                                </label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    minLength="6"
                                    required
                                />

                            </div>

                            {error && (
                                <div className="message error">
                                    {error}
                                </div>
                            )}

                            {message && (
                                <div className="message success">
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="submit-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Please wait..."
                                    : isLogin
                                    ? "Login to CampusEvents →"
                                    : "Create Account →"}
                            </button>

                        </form>

                        <div className="auth-footer">

                            {isLogin ? (
                                <>
                                    Don't have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsLogin(false);
                                            setMessage("");
                                            setError("");
                                        }}
                                    >
                                        Create one
                                    </button>
                                </>
                            ) : (
                                <>
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsLogin(true);
                                            setMessage("");
                                            setError("");
                                        }}
                                    >
                                        Login
                                    </button>
                                </>
                            )}

                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default App;