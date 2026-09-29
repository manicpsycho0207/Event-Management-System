import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

function StudentDashboard({ user, onLogout }) {
    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [waitlist, setWaitlist] = useState([]);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const token =
        localStorage.getItem("eventManagementToken");

    const headers = useMemo(() => ({
        Authorization: `Bearer ${token}`
    }), [token]);

    // ==========================================
    // FETCH DATA
    // ==========================================

    const fetchData = useCallback(async () => {
        try {
            const [
                eventsResponse,
                registrationsResponse,
                waitlistResponse
            ] = await Promise.all([
                axios.get(
                    `${API_URL}/events`,
                    { headers }
                ),

                axios.get(
                    `${API_URL}/registrations/my`,
                    { headers }
                ),

                axios.get(
                    `${API_URL}/registrations/my/waitlist`,
                    { headers }
                )
            ]);

            setEvents(
                eventsResponse.data.events || []
            );

            setRegistrations(
                registrationsResponse.data.registrations || []
            );

            setWaitlist(
                waitlistResponse.data.waitlistEntries || []
            );

        } catch (err) {
            console.error(
                "Dashboard loading error:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    }, [headers]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            fetchData();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [fetchData]);

    // ==========================================
    // REGISTER FOR EVENT
    // ==========================================

    const handleRegister = async (eventId) => {
        try {
            setMessage("");
            setError("");

            const response = await axios.post(
                `${API_URL}/registrations`,
                {
                    eventId: eventId
                },
                {
                    headers: headers
                }
            );

            setMessage(
                response.data.message ||
                "Registration successful."
            );

            await fetchData();

        } catch (err) {
            console.error(
                "Registration error:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Registration failed."
            );

            await fetchData();
        }
    };

    // ==========================================
    // JOIN WAITLIST
    // ==========================================

    const handleJoinWaitlist = async (eventId) => {
        try {
            setMessage("");
            setError("");

            const response = await axios.post(
                `${API_URL}/registrations/waitlist`,
                {
                    eventId: eventId
                },
                {
                    headers: headers
                }
            );

            setMessage(
                response.data.message ||
                "You have joined the waitlist."
            );

            await fetchData();

        } catch (err) {
            console.error(
                "Waitlist error:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Unable to join waitlist."
            );

            await fetchData();
        }
    };

    // ==========================================
    // CANCEL REGISTRATION
    // ==========================================

    const handleCancelRegistration = async (
        eventId
    ) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to cancel your registration?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(
                `${API_URL}/registrations/event/${eventId}`,
                {
                    headers: headers
                }
            );

            setMessage(
                response.data.message ||
                "Registration cancelled."
            );

            await fetchData();

        } catch (err) {
            console.error(
                "Cancellation error:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Unable to cancel registration."
            );
        }
    };

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    const isRegistered = (eventId) => {
        return registrations.some(
            (registration) =>
                registration.event?._id === eventId
        );
    };

    const getWaitlistEntry = (eventId) => {
        return waitlist.find(
            (entry) =>
                entry.event?._id === eventId
        );
    };

    const getWaitlistPosition = (eventId) => {
        return getWaitlistEntry(eventId)?.position ?? null;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events.filter((event) => {
        const eventDate = new Date(`${event.date}T00:00:00`);
        return Number.isNaN(eventDate.getTime()) || eventDate >= today;
    });

    // ==========================================
    // LOADING STATE
    // ==========================================

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-message">
                    Loading dashboard...
                </div>
            </div>
        );
    }

    // ==========================================
    // DASHBOARD
    // ==========================================

    return (
        <div className="dashboard-container">

            <div className="dashboard-topbar">
                <div className="dashboard-brand">
                    <div className="dashboard-brand-icon">🎓</div>
                    <div>
                        <strong>Event Management System</strong>
                        <span>Student Dashboard</span>
                    </div>
                </div>
                <div className="dashboard-account">
                    <span>{user?.name}</span>
                    <span className="role-pill role-pill-student">Student</span>
                    <button className="secondary-button" onClick={onLogout}>
                        Log out
                    </button>
                </div>
            </div>

            {/* Header */}

            <div className="dashboard-header">
                <div>
                    <h1>Student Dashboard</h1>

                    <p>
                        Discover events, reserve your seat, and manage your registrations.
                    </p>
                </div>
            </div>

            {/* Messages */}

            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <section className="stats-grid student-summary-grid" aria-label="Student summary">
                <div className="stat-card">
                    <span className="stat-icon stat-icon-purple" aria-hidden="true">📅</span>
                    <div>
                        <span className="stat-label">Upcoming Events</span>
                        <strong className="stat-value">{upcomingEvents.length}</strong>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon stat-icon-green" aria-hidden="true">✓</span>
                    <div>
                        <span className="stat-label">My Registrations</span>
                        <strong className="stat-value">{registrations.length}</strong>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon stat-icon-orange" aria-hidden="true">⌛</span>
                    <div>
                        <span className="stat-label">My Waitlist</span>
                        <strong className="stat-value">{waitlist.length}</strong>
                    </div>
                </div>
            </section>

            {/* Events */}

            <section className="dashboard-section">

                <div className="section-header">
                    <div>
                        <h2>Upcoming Events</h2>

                        <p>
                            Register while seats are available.
                        </p>
                    </div>
                </div>

                {upcomingEvents.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-state-icon" aria-hidden="true">📅</span>
                        <h3>No upcoming events</h3>

                        <p>
                            There's nothing scheduled yet. Check back soon for new events.
                        </p>
                    </div>
                ) : (

                    <div className="event-grid">

                        {upcomingEvents.map((event) => {

                            const registered =
                                isRegistered(
                                    event._id
                                );

                            const waitlistEntry =
                                getWaitlistEntry(
                                    event._id
                                );

                            const waitlistPosition =
                                getWaitlistPosition(
                                    event._id
                                );

                            const isFull =
                                event.availableSeats <= 0;

                            return (
                                <div
                                    className="event-card"
                                    key={event._id}
                                >

                                    <div className="event-card-header">

                                        <h3>
                                            {event.name}
                                        </h3>

                                        <span className={`event-status-badge ${registered
                                            ? "event-status-registered"
                                            : waitlistEntry
                                                ? "event-status-waitlisted"
                                                : isFull
                                                    ? "event-status-full"
                                                    : "event-status-available"
                                            }`}>
                                            {registered
                                                ? "✓ REGISTERED"
                                                : waitlistEntry
                                                    ? "⏳ WAITLISTED"
                                                    : isFull
                                                        ? "FULL"
                                                        : "AVAILABLE"}
                                        </span>

                                    </div>

                                    <div className="event-details">

                                        <p>
                                            <strong>
                                                Date:
                                            </strong>{" "}
                                            {event.date}
                                        </p>

                                        <p>
                                            <strong>
                                                Time:
                                            </strong>{" "}
                                            {event.time}
                                        </p>

                                        <p>
                                            <strong>
                                                Capacity:
                                            </strong>{" "}
                                            {event.maxCapacity}
                                        </p>

                                        <p>
                                            <strong>
                                                Registered:
                                            </strong>{" "}
                                            {event.registeredSeats}
                                        </p>

                                        <p>
                                            <strong>
                                                Seats Available:
                                            </strong>{" "}
                                            {event.availableSeats}
                                        </p>

                                    </div>

                                    <div className="event-actions">

                                        {/* Registered */}

                                        {registered && (
                                            <>
                                                <div className="status-success">
                                                    ✓ Registered
                                                </div>

                                                <button
                                                    className="danger-button"
                                                    onClick={() =>
                                                        handleCancelRegistration(
                                                            event._id
                                                        )
                                                    }
                                                >
                                                    Cancel Registration
                                                </button>
                                            </>
                                        )}

                                        {/* Waitlisted */}

                                        {!registered &&
                                            waitlistEntry && (
                                                <div className="waitlist-status">

                                                    <div className="status-warning">
                                                        ⏳ Waitlisted
                                                    </div>

                                                    <p>
                                                        Position:{" "}
                                                        <strong>
                                                            #{waitlistPosition}
                                                        </strong>
                                                    </p>

                                                </div>
                                            )}

                                        {/* Available */}

                                        {!registered &&
                                            !waitlistEntry &&
                                            !isFull && (
                                                <button
                                                    className="primary-button"
                                                    onClick={() =>
                                                        handleRegister(
                                                            event._id
                                                        )
                                                    }
                                                >
                                                    Register
                                                </button>
                                            )}

                                        {/* Full */}

                                        {!registered &&
                                            !waitlistEntry &&
                                            isFull && (
                                                <button
                                                    className="primary-button"
                                                    onClick={() =>
                                                        handleJoinWaitlist(
                                                            event._id
                                                        )
                                                    }
                                                >
                                                    Join Waitlist
                                                </button>
                                            )}

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}

            </section>

            {/* My Registrations */}

            <section className="dashboard-section">

                <div className="section-header">

                    <div>
                        <h2>My Registrations</h2>

                        <p>
                            Events you are currently registered for.
                        </p>
                    </div>

                </div>

                {registrations.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-state-icon" aria-hidden="true">🎟️</span>
                        <h3>No registrations yet</h3>
                        <p>
                            You haven't registered for any events yet.
                        </p>
                    </div>
                ) : (

                    <div className="registration-list">

                        {registrations.map(
                            (registration) => (

                                <div
                                    className="registration-item"
                                    key={registration._id}
                                >

                                    <div>

                                        <h3>
                                            {registration.event?.name}
                                        </h3>

                                        <p>
                                            {registration.event?.date}
                                            {" • "}
                                            {registration.event?.time}
                                        </p>

                                    </div>

                                    <div className="registration-status">

                                        <span className="status-success">
                                            Confirmed
                                        </span>

                                        <span className="attendance-status">
                                            Attendance:{" "}
                                            <span className={`attendance-value attendance-${(registration.attendance || "Pending").toLowerCase()}`}>
                                                {registration.attendance || "Pending"}
                                            </span>
                                        </span>

                                    </div>

                                </div>

                            )
                        )}

                    </div>
                )}

            </section>

            {/* My Waitlist */}

            <section className="dashboard-section">

                <div className="section-header">

                    <div>
                        <h2>My Waitlist</h2>

                        <p>
                            Events where you are waiting for a seat.
                        </p>
                    </div>

                </div>

                {waitlist.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-state-icon" aria-hidden="true">⌛</span>
                        <h3>No waitlist entries</h3>
                        <p>
                            You are not currently waiting for any event.
                        </p>

                    </div>
                ) : (

                    <div className="registration-list">

                        {waitlist.map(
                            (entry) => (

                                <div
                                    className="registration-item"
                                    key={entry._id}
                                >

                                    <div>

                                        <h3>
                                            {entry.event?.name}
                                        </h3>

                                        <p>
                                            {entry.event?.date}
                                            {" • "}
                                            {entry.event?.time}
                                        </p>

                                    </div>

                                    <div className="registration-status">

                                        <span className="status-warning">
                                            ⏳ Waitlisted
                                        </span>

                                        <span className="queue-position">
                                            #{entry.position}
                                        </span>

                                        <span>
                                            Joined:{" "}
                                            {new Date(
                                                entry.joinedAt
                                            ).toLocaleString()}
                                        </span>

                                    </div>

                                </div>

                            )
                        )}

                    </div>
                )}

            </section>

        </div>
    );
}

export default StudentDashboard;