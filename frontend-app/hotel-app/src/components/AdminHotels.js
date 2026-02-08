// src/components/AdminHotels.jsx
import React, { useState, useEffect } from "react";
import api from "../api/api";
import HotelImageUploader from "./HotelImageUploader";

export default function AdminHotels() {
  const [hotels, setHotels] = useState([]);
  const [form, setForm] = useState({ name: "", location: "", price_per_night: "", total_rooms: "", description: "" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const load = async () => {
    try {
      const res = await api.get("/hotels");
      setHotels(res.data || []);
    } catch (err) {
      console.error("Load hotels error:", err);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFile = (e) => {
    const f = e.target.files[0];
    setImage(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => fd.append(k, form[k]));
      if (image) fd.append("image", image);

      await api.post("/hotels", fd, { headers: { "Content-Type": "multipart/form-data" } });
      alert("Hotel created");
      setForm({ name: "", location: "", price_per_night: "", total_rooms: "", description: "" });
      setImage(null);
      setPreview(null);
      load();
    } catch (err) {
      console.error("Create hotel error:", err);
      alert(err?.response?.data?.message || "Create failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this hotel?")) return;
    try {
      await api.delete(`/hotels/${id}`);
      alert("Hotel deleted");
      load();
    } catch (err) {
      console.error("Delete hotel error:", err);
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div>
      <h2>Admin — Manage Hotels</h2>

      <div className="container" style={{ marginBottom: 20 }}>
        <form onSubmit={handleCreate}>
          <input name="name" placeholder="Hotel name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input name="location" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          <input name="price_per_night" placeholder="Price per night" value={form.price_per_night} onChange={e => setForm({ ...form, price_per_night: e.target.value })} />
          <input name="total_rooms" placeholder="Total rooms" value={form.total_rooms} onChange={e => setForm({ ...form, total_rooms: e.target.value })} />
          <textarea name="description" placeholder="Description" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

          <input type="file" accept="image/*" onChange={handleFile} />
          {preview && <div style={{ marginTop: 10 }}><img src={preview} alt="preview" style={{ width: 160, height: 100, objectFit: "cover" }} /></div>}
          <button type="submit">Add Hotel</button>
        </form>
      </div>

      <div className="container">
        <h3>Existing Hotels</h3>
        {hotels.length === 0 && <p>No hotels.</p>}
        {hotels.map(h => {
          // build full image URL if stored as relative path
          const src = h.image_url
            ? (h.image_url.startsWith("http") ? h.image_url : `${apiBase}${h.image_url}`)
            : "/placeholder.png";

          return (
            <div key={h.id} className="hotel-card" style={{ alignItems: "flex-start" }}>
              <img src={src} alt={h.name} style={{ width: 160, height: 100, objectFit: "cover", borderRadius: 6 }} />
              <div style={{ flex: 1 }}>
                <h3>{h.name}</h3>
                <p>{h.location}</p>
                <p>₹{h.price_per_night}</p>

                <HotelImageUploader
                  hotelId={h.id}
                  onUploaded={(result) => {
                    setHotels(prev => prev.map(item => {
                      if (item.id !== h.id) return item;
                      // if server returns full hotel, replace; otherwise update image_url
                      if (result && result.id) return result;
                      return { ...item, image_url: result };
                    }));
                  }}
                />

                <div style={{ marginTop: 8 }}>
                  <button onClick={() => handleDelete(h.id)} style={{ background: "#c0392b", color: "white", padding: "8px 12px", border: "none", borderRadius: 6, cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

