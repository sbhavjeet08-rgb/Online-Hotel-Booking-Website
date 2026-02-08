import React, { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

export default function HotelList() {
  const [hotels, setHotels] = useState([]);
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api
      .get("/hotels")
      .then((res) => setHotels(res.data || []))
      .catch((e) => console.error(e));
  }, []);

  const handleBook = (hotelId) => {
    if (!user) {
      const redirectUrl = `/book?hotel=${hotelId}`;
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    } else {
      navigate(`/book?hotel=${hotelId}`);
    }
  };

  // filter logic
  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      const text = `${h.name} ${h.location}`.toLowerCase();
      const q = query.toLowerCase();

      if (q && !text.includes(q)) return false;

      const price = Number(h.price_per_night || 0);
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;

      return true;
    });
  }, [hotels, query, minPrice, maxPrice]);

  return (
    <div className="container">
      <h2>Available Hotels</h2>

      {/* Filters */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Search by name or location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: "1 1 200px" }}
        />
        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={{ width: 120 }}
        />
        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{ width: 120 }}
        />
      </div>

      {filteredHotels.length === 0 && <p>No hotels match your criteria.</p>}
      {filteredHotels.map((h) => {
        const imgSrc = h.image_url
          ? (h.image_url.startsWith("http") ? h.image_url : `${apiBase}${h.image_url}`)
          : "/placeholder.png";

        return (
          <div className="hotel-card" key={h.id} style={{ alignItems: "center" }}>
            <img src={imgSrc} alt={h.name} />
            <div style={{ flex: 1 }}>
              <h3>{h.name}</h3>
              <p>{h.location}</p>
              <p>₹{h.price_per_night} / night</p>
            </div>

            <div style={{ marginLeft: 12 }}>
              <button
                onClick={() => handleBook(h.id)}
                style={{
                  background: "#2c7be5",
                  color: "white",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: 6,
                  cursor: "pointer"
                }}
              >
                Book Now
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}




