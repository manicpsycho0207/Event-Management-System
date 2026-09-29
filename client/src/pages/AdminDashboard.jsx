import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function AdminDashboard({ user, onLogout }) {
    const [events, setEvents] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        date: "",
        time: "",
        maxCapacity: ""
    });

    const [editingEventId, setEditingEventId] = useState(null);

    const [attendees, setAttendees] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const token = localStorage.getItem("eventManagementToken");

    const headers = {
        Authorization: `Bearer ${token}`
    };

    const fetchEvents = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${API_URL}/events`,
                { headers }
            );

            setEvents(response.data.events);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to load events."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const resetForm = () => {
        setFormData({
            name: "",
            date: "",
            time: "",
            maxCapacity: ""
        });

        setEditingEventId(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");
        setSaving(true);

        try {
            if (editingEventId) {
                await axios.put(
                    `${API_URL}/events/${editingEventId}`,
                    formData,
                    { headers }
                );

                setMessage("Event updated successfully.");
            } else {
                await axios.post(
                    `${API_URL}/events`,
                    formData,
                    { headers }
                );

                setMessage("Event created successfully.");
            }

            resetForm();
            await fetchEvents();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to save event."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (event) => {
        setEditingEventId(event._id);

        setFormData({
            name: event.name,
            date: event.date,
            time: event.time,
            maxCapacity: event.maxCapacity
        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDelete = async (eventId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this event? All registrations for this event will also be deleted."
        );

        if (!confirmed) {
            return;
        }

        try {
            setMessage("");
            setError("");

            await axios.delete(
                `${API_URL}/events/${eventId}`,
                { headers }
            );

            setMessage(
                "Event and its registrations deleted successfully."
            );

            await fetchEvents();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to delete event."
            );
        }
    };

    const handleViewAttendees = async (event) => {
        try {
            setError("");
            setMessage("");

            const response = await axios.get(
                `${API_URL}/registrations/event/${event._id}`,
                { headers }
            );

            setAttendees(response.data.registrations);
            setSelectedEvent(event);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to load attendee list."
            );
        }
    };

    const closeAttendees = () => {
        setSelectedEvent(null);
        setAttendees([]);
    };

    const handleLogout = () => {
        localStorage.removeItem("eventManagementToken");
        localStorage.removeItem("eventManagementUser");

        onLogout();
    };

    const totalCapacity = events.reduce(
        (total, event) =>
            total + Number(event.maxCapacity),
        0
    );

    const totalRegistrations = events.reduce(
        (total, event) =>
            total + Number(event.registeredSeats),
        0
    );

    const totalAvailableSeats = events.reduce(
        (total, event) =>
            total + Number(event.availableSeats),
        0
    );

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
                        <span>Admin Portal</span>
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

            <main className="dashboard-content">

                {/* Welcome */}
                <section className="welcome-section">

                    <div>
                        <span className="dashboard-eyebrow">
                            ADMIN DASHBOARD
                        </span>

                        <h1>
                            Event Management
                        </h1>

                        <p>
                            Create events, monitor registrations,
                            and manage your college events.
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
                            <span>Total Events</span>
                            <strong>{events.length}</strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon green">
                            🎟️
                        </div>

                        <div>
                            <span>Registrations</span>
                            <strong>{totalRegistrations}</strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon orange">
                            💺
                        </div>

                        <div>
                            <span>Seats Available</span>
                            <strong>{totalAvailableSeats}</strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon blue">
                            👥
                        </div>

                        <div>
                            <span>Total Capacity</span>
                            <strong>{totalCapacity}</strong>
                        </div>
                    </div>

                </section>

                {/* Create/Edit Event */}
                <section className="admin-form-section">

                    <div className="section-heading">
                        <div>
                            <h2>
                                {editingEventId
                                    ? "Edit Event"
                                    : "Create New Event"}
                            </h2>

                            <p>
                                {editingEventId
                                    ? "Update the event information below."
                                    : "Add a new event for students to register."}
                            </p>
                        </div>

                        {editingEventId && (
                            <button
                                className="secondary-button"
                                onClick={resetForm}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    <form
                        className="event-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="form-field large">
                            <label>Event Name</label>

                            <input
                                type="text"
                                name="name"
                                placeholder="e.g. Annual College Tech Fest"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Date</label>

                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Time</label>

                            <input
                                type="time"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Maximum Seats</label>

                            <input
                                type="number"
                                name="maxCapacity"
                                placeholder="100"
                                min="1"
                                value={formData.maxCapacity}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="primary-button"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingEventId
                                    ? "Update Event"
                                    : "Create Event"}
                            </button>
                        </div>

                    </form>
                </section>

                {/* Events Table */}
                <section className="events-section">

                    <div className="section-heading">
                        <div>
                            <h2>Manage Events</h2>
                            <p>
                                View registration status and manage
                                your events.
                            </p>
                        </div>

                        <button
                            className="refresh-button"
                            onClick={fetchEvents}
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

                            <h3>No events created yet</h3>

                            <p>
                                Use the form above to create your
                                first college event.
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrapper">

                            <table className="events-table">

                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Date & Time</th>
                                        <th>Capacity</th>
                                        <th>Registrations</th>
                                        <th>Available</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {events.map((event) => (
                                        <tr key={event._id}>

                                            <td>
                                                <strong>
                                                    {event.name}
                                                </strong>
                                            </td>

                                            <td>
                                                <div className="table-date">
                                                    {event.date}
                                                </div>

                                                <div className="table-time">
                                                    {event.time}
                                                </div>
                                            </td>

                                            <td>
                                                {event.maxCapacity}
                                            </td>

                                            <td>
                                                <span className="registration-count">
                                                    {
                                                        event.registeredSeats
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        event.availableSeats ===
                                                        0
                                                            ? "seat-badge full"
                                                            : "seat-badge"
                                                    }
                                                >
                                                    {
                                                        event.availableSeats
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="table-actions">

                                                    <button
                                                        className="action-button view"
                                                        onClick={() =>
                                                            handleViewAttendees(
                                                                event
                                                            )
                                                        }
                                                    >
                                                        Attendees
                                                    </button>

                                                    <button
                                                        className="action-button edit"
                                                        onClick={() =>
                                                            handleEdit(
                                                                event
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="action-button delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                event._id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>
                    )}

                </section>

            </main>

            {/* Attendees Modal */}
            {selectedEvent && (
                <div className="modal-overlay">

                    <div className="modal-card">

                        <div className="modal-header">

                            <div>
                                <span className="dashboard-eyebrow">
                                    ATTENDEE LIST
                                </span>

                                <h2>
                                    {selectedEvent.name}
                                </h2>

                                <p>
                                    {attendees.length} registered
                                    student
                                    {attendees.length !== 1
                                        ? "s"
                                        : ""}
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={closeAttendees}
                            >
                                ×
                            </button>

                        </div>

                        {attendees.length === 0 ? (
                            <div className="modal-empty">
                                <div>👥</div>
                                <h3>No registrations yet</h3>
                                <p>
                                    Students who register for this
                                    event will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="attendee-list">

                                {attendees.map((registration, index) => (
                                    <div
                                        className="attendee-row"
                                        key={registration._id}
                                    >

                                        <div className="attendee-number">
                                            {index + 1}
                                        </div>

                                        <div className="attendee-avatar">
                                            {registration.student?.name
                                                ?.charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="attendee-info">
                                            <strong>
                                                {
                                                    registration
                                                        .student?.name
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    registration
                                                        .student?.email
                                                }
                                            </span>
                                        </div>

                                        <span className="registered-status">
                                            Registered
                                        </span>

                                    </div>
                                ))}

                            </div>
                        )}

                    </div>

                </div>
            )}

        </div>
    );
}

export default AdminDashboard;