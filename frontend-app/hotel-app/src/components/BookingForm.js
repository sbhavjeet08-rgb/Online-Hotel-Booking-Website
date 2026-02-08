// src/components/BookingForm.js
import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

/*
  BookingForm:
   - reads ?hotel=<id> and preselects that hotel
   - shows selected hotel details + image
   - calculates nights + total price
   - NO availability checks or rooms-left display
*/

export default function BookingForm() {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);

  const [form, setForm] = useState({
    customer_name: "",
    hotel_id: "",
    check_in: "",
    check_out: ""
  });

  const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // parse ?hotel= from URL
  const params = new URLSearchParams(location.search);
  const hotelFromURL = params.get("hotel");

  // Load hotels once
  useEffect(() => {
    const loadHotels = async () => {
      try {
        const res = await api.get("/hotels");
        setHotels(res.data || []);
      } catch (err) {
        console.error("Failed to load hotels", err);
      }
    };
    loadHotels();
  }, []);

  // auto-select hotel from URL when hotels are loaded
  useEffect(() => {
    if (hotelFromURL && hotels.length > 0) {
      const exists = hotels.find(h => String(h.id) === String(hotelFromURL));
      if (exists) {
        setForm(prev => ({ ...prev, hotel_id: String(hotelFromURL) }));
        setSelectedHotel(exists);
      }
    }
  }, [hotelFromURL, hotels]);

  // When hotel is selected via select control, set selectedHotel
  useEffect(() => {
    if (!form.hotel_id) {
      setSelectedHotel(null);
      return;
    }
    const h = hotels.find(h => Number(h.id) === Number(form.hotel_id));
    setSelectedHotel(h || null);
  }, [form.hotel_id, hotels]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectHotel = (e) => {
    setForm(prev => ({ ...prev, hotel_id: e.target.value }));
  };

  const daysBetween = (d1, d2) => {
    const a = new Date(d1);
    const b = new Date(d2);
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // if not logged in, force login
    if (!user) {
      navigate("/login");
      return;
    }

    const { customer_name, hotel_id, check_in, check_out } = form;

    if (!customer_name || !hotel_id || !check_in || !check_out) {
      alert("Please fill all fields.");
      return;
    }

    if (new Date(check_in) >= new Date(check_out)) {
      alert("Check-in must be before check-out.");
      return;
    }

    try {
      await api.post("/bookings", form);
      alert("Booking successful!");
      setForm({ customer_name: "", hotel_id: "", check_in: "", check_out: "" });
      setSelectedHotel(null);
      // redirect to bookings or home
      navigate("/bookings");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Booking failed");
    }
  };

  const imageSrc = selectedHotel?.image_url
    ? (selectedHotel.image_url.startsWith("http")
        ? selectedHotel.image_url
        : `${apiBase}${selectedHotel.image_url}`)
    : null;

  const nights =
    form.check_in && form.check_out
      ? daysBetween(form.check_in, form.check_out)
      : 0;

  const totalPrice =
    selectedHotel && nights > 0
      ? nights * Number(selectedHotel.price_per_night || 0)
      : 0;

  return (
    <div className="container">
      <h2>Book a Hotel</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="customer_name"
          placeholder="Your name"
          value={form.customer_name}
          onChange={handleChange}
          required
        />

        <select
          name="hotel_id"
          value={form.hotel_id}
          onChange={handleSelectHotel}
          required
          style={{ marginTop: 12 }}
        >
          <option value="">Select a hotel</option>
          {hotels.map(h => (
            <option key={h.id} value={h.id}>
              {h.name} — {h.location} — ₹{h.price_per_night}
            </option>
          ))}
        </select>

        {selectedHotel && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 6
            }}
          >
            <h4 style={{ margin: 0 }}>{selectedHotel.name}</h4>
            <p style={{ margin: "6px 0" }}>
              <strong>Location:</strong> {selectedHotel.location}
            </p>
            <p style={{ margin: "6px 0" }}>
              <strong>Price per night:</strong> ₹{selectedHotel.price_per_night}
            </p>

            {imageSrc && (
              <img
                src={imageSrc}
                alt={selectedHotel.name}
                style={{ width: 200, borderRadius: 6, marginTop: 8 }}
              />
            )}
          </div>
        )}

        <input
          name="check_in"
          type="date"
          value={form.check_in}
          onChange={(e) =>
            setForm(prev => ({ ...prev, check_in: e.target.value }))
          }
          required
          style={{ marginTop: 12 }}
          min={new Date().toISOString().split("T")[0]}
        />

        <input
          name="check_out"
          type="date"
          value={form.check_out}
          onChange={(e) =>
            setForm(prev => ({ ...prev, check_out: e.target.value }))
          }
          required
          style={{ marginTop: 8 }}
          min={form.check_in || new Date().toISOString().split("T")[0]}
        />

        {/* Nights + Price */}
        {nights > 0 && selectedHotel && (
          <div style={{ marginTop: 10 }}>
            <strong>{nights}</strong> night(s) —{" "}
            <strong>₹{totalPrice}</strong> total
          </div>
        )}

        <button
          type="submit"
          style={{ marginTop: 12 }}
        >
          Book Now
        </button>
      </form>
    </div>
  );
}



