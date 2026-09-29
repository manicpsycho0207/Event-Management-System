import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function StudentDashboard({ user, onLogout }) {
    const [events, setEvents] = useState([]);
    const [myRegistrations, setMyRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [registeringId, setRegisteringId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const token = localStorage.getItem("eventManagementToken");

    const headers = {
        Authorization: `Bearer ${token}`
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [eventsResponse, registrationsResponse] =
                await Promise.all([
                    axios.get(`${API_URL}/events`, { headers }),
                    axios.get(`${API_URL}/registrations/my`, {
                        headers
                    })
                ]);

            setEvents(eventsResponse.data.events);
            setMyRegistrations(
                registrationsResponse.data.registrations
            );
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const isRegistered = (eventId) => {
        return myRegistrations.some(
            (registration) =>
                registration.event?._id === eventId
        );
    };

    const handleRegister = async (eventId) => {
        try {
            setRegisteringId(eventId);
            setMessage("");
            setError("");

            const response = await axios.post(
                `${API_URL}/registrations`,
                {
                    eventId
                },
                {
                    headers
                }
            );

            setMessage(response.data.message);

            // Refresh event and registration information
            await fetchData();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to register for this event."
            );
        } finally {
            setRegisteringId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("eventManagementToken");
        localStorage.removeItem("eventManagementUser");

        onLogout();
    };

    const totalEvents = events.length;

    const registeredCount = myRegistrations.length;

    const availableEvents = events.filter(
        (event) =>
            event.availableSeats > 0 &&
            !isRegistered(event._id)
    ).length;

    return (
        <div className="dashboard-page">

            {/* Header */}
            <header className="dashboard-header">
                <div className="dashboard-brand">
                    <div className="dashboard-brand-icon">
                        🎓
                    </div>

                    <div>
                        <h2>CampusEvents</h2>
                        <span>Student Portal</span>
                    </div>
                </div>

                <div className="dashboard-user">
                    <div className="user-info">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                    </div>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-content">

                {/* Welcome */}
                <section className="welcome-section">
                    <div>
                        <span className="dashboard-eyebrow">
                            STUDENT DASHBOARD
                        </span>

                        <h1>
                            Welcome, {user.name.split(" ")[0]}! 👋
                        </h1>

                        <p>
                            Discover upcoming college events and
                            reserve your seat before they fill up.
                        </p>
                    </div>
                </section>

                {/* Messages */}
                {message && (
                    <div className="dashboard-message success">
                        ✓ {message}
                    </div>
                )}

                {error && (
                    <div className="dashboard-message error">
                        {error}
                    </div>
                )}

                {/* Statistics */}
                <section className="stats-grid">

                    <div className="stat-card">
                        <div className="stat-icon purple">
                            📅
                        </div>

                        <div>
                            <span>Upcoming Events</span>
                            <strong>{totalEvents}</strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon green">
                            🎟️
                        </div>

                        <div>
                            <span>My Registrations</span>
                            <strong>{registeredCount}</strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon orange">
                            🔥
                        </div>

                        <div>
                            <span>Available to Join</span>
                            <strong>{availableEvents}</strong>
                        </div>
                    </div>

                </section>

                {/* Events */}
                <section className="events-section">

                    <div className="section-heading">
                        <div>
                            <h2>Upcoming Events</h2>
                            <p>
                                Explore events happening on campus.
                            </p>
                        </div>

                        <button
                            className="refresh-button"
                            onClick={fetchData}
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <div className="loading-spinner"></div>
                            <p>Loading events...</p>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                📅
                            </div>

                            <h3>No events available</h3>

                            <p>
                                There are currently no events
                                available for registration.
                            </p>
                        </div>
                    ) : (
                        <div className="event-grid">

                            {events.map((event) => {
                                const registered =
                                    isRegistered(event._id);

                                const isFull =
                                    event.availableSeats <= 0;

                                return (
                                    <div
                                        className="event-card"
                                        key={event._id}
                                    >
                                        <div className="event-card-top">
                                            <div className="event-calendar">
                                                <span>
                                                    {new Date(
                                                        event.date
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            month: "short"
                                                        }
                                                    )}
                                                </span>

                                                <strong>
                                                    {new Date(
                                                        event.date
                                                    ).getDate()}
                                                </strong>
                                            </div>

                                            <span
                                                className={
                                                    isFull
                                                        ? "capacity-badge full"
                                                        : "capacity-badge"
                                                }
                                            >
                                                {isFull
                                                    ? "Full"
                                                    : `${event.availableSeats} seats left`}
                                            </span>
                                        </div>

                                        <div className="event-card-body">

                                            <h3>{event.name}</h3>

                                            <div className="event-detail">
                                                <span>📅</span>
                                                {event.date}
                                            </div>

                                            <div className="event-detail">
                                                <span>🕐</span>
                                                {event.time}
                                            </div>

                                            <div className="event-capacity">
                                                <div className="capacity-label">
                                                    <span>
                                                        Registration
                                                    </span>

                                                    <span>
                                                        {
                                                            event.registeredSeats
                                                        }
                                                        /
                                                        {
                                                            event.maxCapacity
                                                        }
                                                    </span>
                                                </div>

                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{
                                                            width: `${Math.min(
                                                                (event.registeredSeats /
                                                                    event.maxCapacity) *
                                                                    100,
                                                                100
                                                            )}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {registered ? (
                                                <button
                                                    className="event-button registered"
                                                    disabled
                                                >
                                                    ✓ Registered
                                                </button>
                                            ) : isFull ? (
                                                <button
                                                    className="event-button full"
                                                    disabled
                                                >
                                                    Event Full
                                                </button>
                                            ) : (
                                                <button
                                                    className="event-button"
                                                    onClick={() =>
                                                        handleRegister(
                                                            event._id
                                                        )
                                                    }
                                                    disabled={
                                                        registeringId ===
                                                        event._id
                                                    }
                                                >
                                                    {registeringId ===
                                                    event._id
                                                        ? "Registering..."
                                                        : "Register Now →"}
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
                <section className="my-registrations-section">

                    <div className="section-heading">
                        <div>
                            <h2>My Registrations</h2>
                            <p>
                                Events you have successfully joined.
                            </p>
                        </div>
                    </div>

                    {myRegistrations.length === 0 ? (
                        <div className="registration-empty">
                            You haven't registered for any events yet.
                        </div>
                    ) : (
                        <div className="registration-list">

                            {myRegistrations.map(
                                (registration) => (
                                    <div
                                        className="registration-row"
                                        key={registration._id}
                                    >
                                        <div className="registration-icon">
                                            🎟️
                                        </div>

                                        <div className="registration-info">
                                            <strong>
                                                {
                                                    registration.event
                                                        ?.name
                                                }
                                            </strong>

                                            <span>
                                                📅{" "}
                                                {
                                                    registration.event
                                                        ?.date
                                                }{" "}
                                                &nbsp; • &nbsp;
                                                🕐{" "}
                                                {
                                                    registration.event
                                                        ?.time
                                                }
                                            </span>
                                        </div>

                                        <span className="registered-status">
                                            Registered
                                        </span>
                                    </div>
                                )
                            )}

                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}

export default StudentDashboard;