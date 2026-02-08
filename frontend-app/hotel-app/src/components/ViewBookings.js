// src/components/ViewBookings.js
import React, { useEffect, useState, useContext, useCallback } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

export default function ViewBookings() {
  const [bookings, setBookings] = useState([]);
  const { user, isAdmin } = useContext(AuthContext);

  // choose endpoint: admin => all, logged-in user => my, guest => all (public)
  const loadBookings = useCallback(async () => {
    try {
      const url = isAdmin ? "/bookings" : (user ? "/bookings/my" : "/bookings");
      const res = await api.get(url);
      setBookings(res.data);
    } catch (err) {
      console.error("Load bookings error:", err);
      setBookings([]);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      alert("Booking cancelled");
      await loadBookings();
    } catch (err) {
      const message = err?.response?.data?.message || "Unable to cancel booking";
      alert(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this booking? This cannot be undone.")) return;
    try {
      await api.delete(`/bookings/${id}`);
      alert("Booking deleted");
      await loadBookings();
    } catch (err) {
      const message = err?.response?.data?.message || "Unable to delete booking";
      alert(message);
    }
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container">
      <h2>{isAdmin ? "All Bookings (Admin)" : (user ? "My Bookings" : "All Bookings")}</h2>

      {bookings.length === 0 && <p>No bookings found.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {bookings.map((b) => (
          <li key={b.id} style={{ marginBottom: 12, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div><strong>{b.customer_name}</strong> — <em>{b.hotel}</em></div>
                <div>{formatDate(b.check_in)} → {formatDate(b.check_out)}</div>
                <div>Status: <strong>{b.status}</strong></div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {/* Cancel: only when booked and user is owner or admin */}
                {b.status === "booked" && user && (isAdmin || (b.user_id && Number(b.user_id) === Number(user.id))) && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    style={{ background: "#e74c3c", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                )}

                {/* Delete: owner or admin */}
                {user && (isAdmin || (b.user_id && Number(b.user_id) === Number(user.id))) && (
                  <button
                    onClick={() => handleDelete(b.id)}
                    style={{ background: "#111", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}





