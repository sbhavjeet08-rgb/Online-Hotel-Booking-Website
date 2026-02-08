// Navbar.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAdmin } = useContext(AuthContext);

  return (
    <div className="nav">
      <Link to="/">Home</Link>
      <Link to="/book">Book</Link>
      <Link to="/bookings">Bookings</Link>
      {isAdmin && <Link to="/admin">Admin</Link>}

      <span className="right">
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <span style={{ marginRight: 12 }}>Hello, {user.name}</span>
            <button
              onClick={() => { logout(); window.location.href = "/"; }}
              style={{
                background: "transparent",
                color: "white",
                border: "1px solid white",
                padding: "6px 8px",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </>
        )}
      </span>
    </div>
  );
}

