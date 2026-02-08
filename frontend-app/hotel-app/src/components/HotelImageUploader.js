// src/components/HotelImageUploader.jsx
import React, { useState } from "react";
import api from "../api/api";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export default function HotelImageUploader({ hotelId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectFile = (f) => {
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      return alert("Only JPG / PNG / WEBP / GIF images allowed.");
    }
    if (f.size > MAX_SIZE) {
      return alert("File too large (max 5MB).");
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Choose an image");

    const fd = new FormData();
    fd.append("image", file);

    try {
      setBusy(true);
      setProgress(0);

      const res = await api.post(`/hotels/${hotelId}/image`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
        }
      });

      // server returns { hotel } or { image_url }
      const payload = res.data.hotel || res.data.image_url || res.data;
      onUploaded && onUploaded(payload);
      alert("Image uploaded");
      clearSelection();
    } catch (err) {
      console.error("Upload error:", err);
      alert(err?.response?.data?.message || "Upload failed");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => selectFile(e.target.files[0])}
          disabled={busy}
        />
        {preview && (
          <div style={{ marginTop: 8 }}>
            <img
              src={preview}
              alt="preview"
              style={{ width: 160, height: 100, objectFit: "cover", borderRadius: 6 }}
            />
          </div>
        )}

        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button type="submit" disabled={!file || busy} style={{ padding: "6px 10px" }}>
            {busy ? `Uploading ${progress}%` : "Upload Image"}
          </button>

          <button type="button" onClick={clearSelection} disabled={busy} style={{ padding: "6px 10px" }}>
            Clear
          </button>
        </div>

        {busy && <div style={{ marginTop: 6 }}><small>Uploading: {progress}%</small></div>}
      </form>
    </div>
  );
}
