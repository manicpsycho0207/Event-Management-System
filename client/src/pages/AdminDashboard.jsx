import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

function AdminDashboard({ user, onLogout }) {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [attendees, setAttendees] = useState([]);
    const [waitlist, setWaitlist] = useState([]);
    const [activeDetails, setActiveDetails] = useState("attendees");

    const [showAttendees, setShowAttendees] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        date: "",
        time: "",
        maxCapacity: ""
    });

    const token =
        localStorage.getItem("eventManagementToken");

    const headers = useMemo(() => ({
        Authorization: `Bearer ${token}`
    }), [token]);


    // ==========================================
    // FETCH EVENTS
    // ==========================================

    const fetchEvents = useCallback(async () => {
        try {
            const response = await axios.get(
                `${API_URL}/events`,
                { headers }
            );

            setEvents(
                response.data.events || []
            );
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to load events."
            );
        } finally {
            setLoading(false);
        }
    }, [headers]);


    useEffect(() => {
        const timer = window.setTimeout(() => {
            fetchEvents();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [fetchEvents]);


    // ==========================================
    // FORM HANDLING
    // ==========================================

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };


    const resetForm = () => {
        setFormData({
            name: "",
            date: "",
            time: "",
            maxCapacity: ""
        });

        setEditingEvent(null);
        setShowForm(false);
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setMessage("");
            setError("");

            if (editingEvent) {
                await axios.put(
                    `${API_URL}/events/${editingEvent._id}`,
                    {
                        name: formData.name,
                        date: formData.date,
                        time: formData.time,
                        maxCapacity: Number(
                            formData.maxCapacity
                        )
                    },
                    { headers }
                );

                setMessage(
                    "Event updated successfully."
                );
            } else {
                await axios.post(
                    `${API_URL}/events`,
                    {
                        name: formData.name,
                        date: formData.date,
                        time: formData.time,
                        maxCapacity: Number(
                            formData.maxCapacity
                        )
                    },
                    { headers }
                );

                setMessage(
                    "Event created successfully."
                );
            }

            resetForm();
            await fetchEvents();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save event."
            );
        }
    };


    // ==========================================
    // EDIT EVENT
    // ==========================================

    const handleEdit = (event) => {
        setEditingEvent(event);

        setFormData({
            name: event.name,
            date: event.date,
            time: event.time,
            maxCapacity: event.maxCapacity
        });

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // ==========================================
    // DELETE EVENT
    // ==========================================

    const handleDelete = async (eventId) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this event? All registrations and waitlist entries will also be deleted."
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
                "Event deleted successfully."
            );

            if (
                selectedEvent &&
                selectedEvent._id === eventId
            ) {
                setSelectedEvent(null);
                setShowAttendees(false);
            }

            await fetchEvents();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete event."
            );
        }
    };


    // ==========================================
    // VIEW ATTENDEES + WAITLIST
    // ==========================================

    const handleViewAttendees = async (event, section = "attendees") => {
        try {
            setLoadingDetails(true);
            setMessage("");
            setError("");

            const [
                attendeesResponse,
                waitlistResponse
            ] = await Promise.all([
                axios.get(
                    `${API_URL}/registrations/event/${event._id}`,
                    { headers }
                ),

                axios.get(
                    `${API_URL}/registrations/event/${event._id}/waitlist`,
                    { headers }
                )
            ]);

            setSelectedEvent(event);
            setActiveDetails(section);

            setAttendees(
                attendeesResponse.data.registrations ||
                []
            );

            setWaitlist(
                waitlistResponse.data.waitlistEntries ||
                []
            );

            setShowAttendees(true);

            window.requestAnimationFrame(() => {
                document
                    .getElementById("event-attendance-details")
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
            });
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to load attendee information."
            );
        } finally {
            setLoadingDetails(false);
        }
    };


    // ==========================================
    // MARK ATTENDANCE
    // ==========================================

    const handleAttendance = async (
        registrationId,
        attendance
    ) => {
        try {
            setMessage("");
            setError("");

            const response = await axios.put(
                `${API_URL}/registrations/${registrationId}/attendance`,
                {
                    attendance
                },
                { headers }
            );

            setMessage(
                response.data.message ||
                "Attendance updated successfully."
            );

            // Update local attendee list
            setAttendees((previous) =>
                previous.map((registration) =>
                    registration._id ===
                    registrationId
                        ? {
                              ...registration,
                              attendance
                          }
                        : registration
                )
            );

            await fetchEvents();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update attendance."
            );
        }
    };


    // ==========================================
    // DASHBOARD STATISTICS
    // ==========================================

    const totalEvents = events.length;

    const totalRegistrations = events.reduce(
        (total, event) =>
            total +
            Number(event.registeredSeats || 0),
        0
    );

    const totalWaitlisted = events.reduce(
        (total, event) =>
            total + Number(event.waitlistedCount || 0),
        0
    );

    const totalPendingAttendance = events.reduce(
        (total, event) =>
            total + Number(event.pendingAttendanceCount || 0),
        0
    );

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-message">
                    Loading admin dashboard...
                </div>
            </div>
        );
    }


    return (
        <div className="dashboard-container">

            <div className="dashboard-topbar">
                <div className="dashboard-brand">
                    <div className="dashboard-brand-icon">🎓</div>
                    <div>
                        <strong>Event Management System</strong>
                        <span>Admin Portal</span>
                    </div>
                </div>
                <div className="dashboard-account">
                    <span>{user?.name}</span>
                    <span className="role-pill role-pill-admin">Admin</span>
                    <button className="secondary-button" onClick={onLogout}>
                        Log out
                    </button>
                </div>
            </div>

            {/* =====================================
                HEADER
            ====================================== */}

            <div className="dashboard-header">

                <div>
                    <h1>Admin Dashboard</h1>

                    <p>
                        Manage events, registrations, waitlists, and attendance.
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => {
                        setEditingEvent(null);

                        setFormData({
                            name: "",
                            date: "",
                            time: "",
                            maxCapacity: ""
                        });

                        setShowForm(true);

                        window.scrollTo({
                            top: 0,
                            behavior: "smooth"
                        });
                    }}
                >
                    + Create Event
                </button>

            </div>


            {/* =====================================
                MESSAGES
            ====================================== */}

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


            {/* =====================================
                STATISTICS
            ====================================== */}

            <div className="stats-grid">

                <div className="stat-card">
                    <span className="stat-icon stat-icon-purple" aria-hidden="true">📅</span>
                    <div>
                        <span className="stat-label">Total Events</span>

                        <strong className="stat-value">{totalEvents}</strong>
                    </div>
                </div>


                <div className="stat-card">
                    <span className="stat-icon stat-icon-green" aria-hidden="true">✓</span>
                    <div>
                        <span className="stat-label">Confirmed Registrations</span>

                        <strong className="stat-value">{totalRegistrations}</strong>
                    </div>
                </div>


                <div className="stat-card">
                    <span className="stat-icon stat-icon-orange" aria-hidden="true">⌛</span>
                    <div>
                        <span className="stat-label">Total Waitlisted</span>

                        <strong className="stat-value">{totalWaitlisted}</strong>
                    </div>
                </div>


                <div className="stat-card">
                    <span className="stat-icon stat-icon-blue" aria-hidden="true">◷</span>
                    <div>
                        <span className="stat-label">Attendance Pending</span>

                        <strong className="stat-value">{totalPendingAttendance}</strong>
                    </div>
                </div>


            </div>


            {/* =====================================
                CREATE / EDIT FORM
            ====================================== */}

            {showForm && (
                <section className="dashboard-section">

                    <div className="section-header">

                        <div>
                            <h2>
                                {editingEvent
                                    ? "Edit Event"
                                    : "Create New Event"}
                            </h2>

                            <p>
                                Enter the event details below.
                            </p>
                        </div>

                        <button
                            className="secondary-button"
                            onClick={resetForm}
                        >
                            Cancel
                        </button>

                    </div>


                    <form
                        className="event-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="form-group">
                            <label htmlFor="event-name">
                                Event Name
                            </label>

                            <input
                                id="event-name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={
                                    handleInputChange
                                }
                                placeholder="Enter event name"
                                required
                            />
                        </div>


                        <div className="form-row">

                            <div className="form-group">
                                <label htmlFor="event-date">
                                    Date
                                </label>

                                <input
                                    id="event-date"
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={
                                        handleInputChange
                                    }
                                    required
                                />
                            </div>


                            <div className="form-group">
                                <label htmlFor="event-time">
                                    Time
                                </label>

                                <input
                                    id="event-time"
                                    type="time"
                                    name="time"
                                    value={formData.time}
                                    onChange={
                                        handleInputChange
                                    }
                                    required
                                />
                            </div>


                            <div className="form-group">
                                <label htmlFor="event-capacity">
                                    Maximum Seats
                                </label>

                                <input
                                    id="event-capacity"
                                    type="number"
                                    name="maxCapacity"
                                    value={
                                        formData.maxCapacity
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    min="1"
                                    placeholder="100"
                                    required
                                />
                            </div>

                        </div>


                        <button
                            type="submit"
                            className="primary-button"
                        >
                            {editingEvent
                                ? "Update Event"
                                : "Create Event"}
                        </button>

                    </form>

                </section>
            )}


            {/* =====================================
                MANAGE EVENTS
            ====================================== */}

            <section className="dashboard-section">

                <div className="section-header">

                    <div>
                        <h2>
                            Manage Events
                        </h2>

                        <p>Manage event details and monitor confirmed seats.</p>
                    </div>
                    <button className="refresh-button" onClick={fetchEvents}>
                        Refresh events
                    </button>

                </div>


                {events.length === 0 ? (

                    <div className="empty-state">

                        <span className="empty-state-icon" aria-hidden="true">📅</span>

                        <h3>
                            No events created
                        </h3>

                        <p>
                            Create your first college event
                            to get started.
                        </p>

                    </div>

                ) : (

                    <div className="event-grid">

                        {events.map((event) => (

                            <div
                                className="event-card"
                                key={event._id}
                            >

                                <div className="event-card-header">

                                        <h3>{event.name}</h3>

                                    <span className={`event-status-badge ${event.availableSeats === 0
                                        ? "event-status-full"
                                        : "event-status-available"
                                        }`}>
                                        {event.availableSeats === 0 ? "FULL" : "AVAILABLE"}
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


                                <div className="event-actions admin-event-actions">

                                    <button
                                        className="primary-button"
                                        onClick={() =>
                                            handleViewAttendees(
                                                event,
                                                "attendees"
                                            )
                                        }
                                    >
                                        View Attendees
                                    </button>

                                    <button
                                        className="secondary-button"
                                        onClick={() =>
                                            handleViewAttendees(
                                                event,
                                                "waitlist"
                                            )
                                        }
                                    >
                                        View Waitlist
                                    </button>


                                    <button
                                        className="secondary-button"
                                        onClick={() =>
                                            handleEdit(event)
                                        }
                                    >
                                        Edit
                                    </button>


                                    <button
                                        className="danger-button"
                                        onClick={() =>
                                            handleDelete(
                                                event._id
                                            )
                                        }
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </section>


            {/* =====================================
                ATTENDEE / WAITLIST DETAILS
            ====================================== */}

            {showAttendees &&
                selectedEvent && (

                    <section
                        id="event-attendance-details"
                        className="dashboard-section"
                    >

                        <div className="section-header">

                            <div>

                                <h2>
                                    {selectedEvent.name}
                                </h2>

                                <p>
                                    Registered attendees,
                                    waitlisted students
                                    and attendance.
                                </p>

                            </div>

                            <button
                                className="secondary-button"
                                onClick={() => {
                                    setShowAttendees(false);
                                    setSelectedEvent(null);
                                }}
                            >
                                Close
                            </button>

                        </div>


                        {loadingDetails ? (

                            <div className="loading-message">
                                Loading attendee details...
                            </div>

                        ) : (

                            <>

                                <div className="detail-tabs" role="tablist" aria-label="Event details">
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={activeDetails === "attendees"}
                                        className={activeDetails === "attendees" ? "detail-tab active" : "detail-tab"}
                                        onClick={() => setActiveDetails("attendees")}
                                    >
                                        Confirmed Attendees ({attendees.length})
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={activeDetails === "waitlist"}
                                        className={activeDetails === "waitlist" ? "detail-tab active" : "detail-tab"}
                                        onClick={() => setActiveDetails("waitlist")}
                                    >
                                        Waitlist ({waitlist.length})
                                    </button>
                                </div>

                                {/* =================================
                                    CONFIRMED ATTENDEES
                                ================================== */}

                                {activeDetails === "attendees" && (
                                <div className="attendance-section">

                                    <h3>
                                        Confirmed Attendees
                                    </h3>


                                    {attendees.length === 0 ? (

                                        <div className="empty-state">
                                            <span className="empty-state-icon" aria-hidden="true">👥</span>
                                            <h3>No confirmed attendees</h3>
                                            <p>Confirmed registrations will appear here.</p>
                                        </div>

                                    ) : (

                                        <div className="table-wrapper">

                                            <table className="data-table">

                                                <thead>

                                                    <tr>

                                                        <th>
                                                            #
                                                        </th>

                                                        <th>
                                                            Student Name
                                                        </th>

                                                        <th>
                                                            Email
                                                        </th>

                                                        <th>
                                                            Registration Time
                                                        </th>

                                                        <th>
                                                            Attendance
                                                        </th>

                                                        <th>Action</th>

                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {attendees.map(
                                                        (
                                                            registration,
                                                            index
                                                        ) => (

                                                            <tr
                                                                key={
                                                                    registration._id
                                                                }
                                                            >

                                                                <td>
                                                                    {index + 1}
                                                                </td>

                                                                <td>
                                                                    {
                                                                        registration
                                                                            .student
                                                                            ?.name
                                                                    }
                                                                </td>

                                                                <td>
                                                                    {
                                                                        registration
                                                                            .student
                                                                            ?.email
                                                                    }
                                                                </td>

                                                                <td>
                                                                    {new Date(
                                                                        registration.registeredAt
                                                                    ).toLocaleString()}
                                                                </td>

                                                                <td>
                                                                    <span className={`attendance-value attendance-${(registration.attendance || "Pending").toLowerCase()}`}>
                                                                        {registration.attendance || "Pending"}
                                                                    </span>
                                                                </td>

                                                                <td>
                                                                    <div className="attendance-actions">
                                                                        <button
                                                                            className={registration.attendance === "Attended" ? "attendance-button active" : "attendance-button"}
                                                                            onClick={() => handleAttendance(registration._id, "Attended")}
                                                                        >
                                                                            ✓ Attended
                                                                        </button>
                                                                        <button
                                                                            className={registration.attendance === "Absent" ? "attendance-button active" : "attendance-button"}
                                                                            onClick={() => handleAttendance(registration._id, "Absent")}
                                                                        >
                                                                            ✕ Absent
                                                                        </button>
                                                                    </div>
                                                                </td>

                                                            </tr>

                                                        )
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                    )}

                                </div>
                                )}


                                {/* =================================
                                    WAITLIST
                                ================================== */}

                                {activeDetails === "waitlist" && (
                                <div className="waitlist-section">

                                    <h3>
                                        Waitlisted Students
                                    </h3>


                                    {waitlist.length === 0 ? (

                                        <div className="empty-state">
                                            <span className="empty-state-icon" aria-hidden="true">⌛</span>
                                            <h3>No waitlisted students</h3>
                                            <p>Students who join this event's waitlist will appear here in FIFO order.</p>
                                        </div>

                                    ) : (

                                        <div className="table-wrapper">

                                            <table className="data-table">

                                                <thead>

                                                    <tr>

                                                        <th>
                                                            Position
                                                        </th>

                                                        <th>
                                                            Student
                                                        </th>

                                                        <th>
                                                            Email
                                                        </th>

                                                        <th>
                                                            Joined At
                                                        </th>

                                                    </tr>

                                                </thead>


                                                <tbody>

                                                    {waitlist.map(
                                                        (
                                                            entry,
                                                            index
                                                        ) => (

                                                            <tr
                                                                key={
                                                                    entry._id
                                                                }
                                                            >

                                                                <td>
                                                                    <strong className="queue-position">
                                                                        #{entry.position || index + 1}
                                                                    </strong>
                                                                </td>

                                                                <td>
                                                                    {entry.student?.name}
                                                                </td>

                                                                <td>
                                                                    {
                                                                        entry
                                                                            .student
                                                                            ?.email
                                                                    }
                                                                </td>

                                                                <td>
                                                                    {new Date(
                                                                        entry.joinedAt
                                                                    ).toLocaleString()}
                                                                </td>

                                                            </tr>

                                                        )
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                    )}

                                </div>
                                )}

                            </>

                        )}

                    </section>

                )}

        </div>
    );
}

export default AdminDashboard;