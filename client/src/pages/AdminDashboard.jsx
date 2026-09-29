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

    const handleViewAttendees = async (event) => {
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

            setAttendees(
                attendeesResponse.data.registrations ||
                []
            );

            setWaitlist(
                waitlistResponse.data.waitlistEntries ||
                []
            );

            setShowAttendees(true);

            window.scrollTo({
                top: 0,
                behavior: "smooth"
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

    const totalCapacity = events.reduce(
        (total, event) =>
            total + Number(event.maxCapacity || 0),
        0
    );

    const totalRegistrations = events.reduce(
        (total, event) =>
            total +
            Number(event.registeredSeats || 0),
        0
    );

    const totalAvailableSeats =
        events.reduce(
            (total, event) =>
                total +
                Number(event.availableSeats || 0),
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
                        <strong>CampusEvents</strong>
                        <span>Admin Portal</span>
                    </div>
                </div>
                <div className="dashboard-account">
                    <span>{user?.name}</span>
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
                        Manage events, registrations,
                        waitlists and attendance.
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
                    <span className="stat-label">
                        Total Events
                    </span>

                    <strong className="stat-value">
                        {totalEvents}
                    </strong>
                </div>


                <div className="stat-card">
                    <span className="stat-label">
                        Registrations
                    </span>

                    <strong className="stat-value">
                        {totalRegistrations}
                    </strong>
                </div>


                <div className="stat-card">
                    <span className="stat-label">
                        Seats Available
                    </span>

                    <strong className="stat-value">
                        {totalAvailableSeats}
                    </strong>
                </div>


                <div className="stat-card">
                    <span className="stat-label">
                        Total Capacity
                    </span>

                    <strong className="stat-value">
                        {totalCapacity}
                    </strong>
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
                            <label>
                                Event Name
                            </label>

                            <input
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
                                <label>
                                    Date
                                </label>

                                <input
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
                                <label>
                                    Time
                                </label>

                                <input
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
                                <label>
                                    Maximum Seats
                                </label>

                                <input
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

                        <p>
                            Manage your events and monitor
                            registrations.
                        </p>
                    </div>

                </div>


                {events.length === 0 ? (

                    <div className="empty-state">

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

                                    <h3>
                                        {event.name}
                                    </h3>

                                    {event.availableSeats === 0 && (
                                        <span className="event-badge">
                                            FULL
                                        </span>
                                    )}

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

                                    <button
                                        className="primary-button"
                                        onClick={() =>
                                            handleViewAttendees(
                                                event
                                            )
                                        }
                                    >
                                        View Attendees
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

                    <section className="dashboard-section">

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

                                {/* =================================
                                    CONFIRMED ATTENDEES
                                ================================== */}

                                <div className="attendance-section">

                                    <h3>
                                        Confirmed Attendees
                                    </h3>


                                    {attendees.length === 0 ? (

                                        <div className="empty-state">
                                            <p>
                                                No confirmed attendees.
                                            </p>
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
                                                            Student
                                                        </th>

                                                        <th>
                                                            Email
                                                        </th>

                                                        <th>
                                                            Registered At
                                                        </th>

                                                        <th>
                                                            Attendance
                                                        </th>

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

                                                                    <div className="attendance-actions">

                                                                        <span className="attendance-current">
                                                                            Current: {registration.attendance || "Pending"}
                                                                        </span>

                                                                        <button
                                                                            className={
                                                                                registration.attendance ===
                                                                                "Attended"
                                                                                    ? "attendance-button active"
                                                                                    : "attendance-button"
                                                                            }
                                                                            onClick={() =>
                                                                                handleAttendance(
                                                                                    registration._id,
                                                                                    "Attended"
                                                                                )
                                                                            }
                                                                        >
                                                                            ✓ Attended
                                                                        </button>


                                                                        <button
                                                                            className={
                                                                                registration.attendance ===
                                                                                "Absent"
                                                                                    ? "attendance-button active"
                                                                                    : "attendance-button"
                                                                            }
                                                                            onClick={() =>
                                                                                handleAttendance(
                                                                                    registration._id,
                                                                                    "Absent"
                                                                                )
                                                                            }
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


                                {/* =================================
                                    WAITLIST
                                ================================== */}

                                <div className="waitlist-section">

                                    <h3>
                                        Waitlisted Students
                                    </h3>


                                    {waitlist.length === 0 ? (

                                        <div className="empty-state">
                                            <p>
                                                No students are currently
                                                on the waitlist.
                                            </p>
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
                                                                    <strong>
                                                                        {entry.position || index + 1}
                                                                    </strong>
                                                                </td>

                                                                <td>
                                                                    {
                                                                        entry
                                                                            .student
                                                                            ?.name
                                                                    }
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

                            </>

                        )}

                    </section>

                )}

        </div>
    );
}

export default AdminDashboard;