// LoginForm.jsx
import React, { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // read ?redirect= from query params
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect") || "/";

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
    const res = await api.post("/auth/login", form);
    const token = res.data.token;
    if (!token) throw new Error("No token returned");
    await login(token);
    navigate(redirect, { replace: true });
  } catch (err) {
    alert(err?.response?.data?.message || err.message || "Login failed");
  }
};


  return (
    <div className="container">
      <h2>Login</h2>

      <form onSubmit={submit}>
        <input
          name="email"
          placeholder="Email"
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />

        <button type="submit">Login</button>
      </form>

      <p style={{ marginTop: "10px" }}>
        New user? <a href="/register">Register here</a>
      </p>
    </div>
  );
}

