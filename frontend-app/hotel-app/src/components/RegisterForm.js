import React, { useState } from "react";
import api from "../api/api";

export default function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

const submit = async (e) => {
  e.preventDefault();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!emailRegex.test(form.email)) {
    alert("Please enter a valid email address (e.g. abc@gmail.com)");
    return;
  }

  if (!passwordRegex.test(form.password)) {
    alert(
      "Password must be at least 8 characters and include uppercase, lowercase, and a number"
    );
    return;
  }

  try {
    await api.post("/auth/register", form);
    alert("Registered successfully. Please login.");
    window.location.href = "/login";
  } catch (err) {
    alert(err?.response?.data?.message || "Register failed");
  }
};


  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input name="name" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input name="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

