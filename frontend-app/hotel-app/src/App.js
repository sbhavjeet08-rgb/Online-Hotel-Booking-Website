import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import HotelList from "./components/HotelList";
import BookingForm from "./components/BookingForm";
import ViewBookings from "./components/ViewBookings";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import AdminHotels from "./components/AdminHotels";

function Home() {
  return (
    <div className="container">
      <h1>Online Hotel Booking System</h1>
      <HotelList />
    </div>
  );
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useContext(AuthContext);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<BookingForm />} />
          <Route path="/bookings" element={<ViewBookings />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div className="container">
                  <AdminHotels />
                </div>
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
