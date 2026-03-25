import React, { useState } from "react";
import axios from "axios";
import { THEME } from "../theme";

export default function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await axios.post("/api/auth/register", { username, password });
      }
      const res = await axios.post("/api/auth/token", new URLSearchParams({ username, password }), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      localStorage.setItem("token", res.data.access_token);
      onLogin(res.data.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: THEME.surface,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: THEME.background, borderRadius: 16, padding: 40,
        width: 360, boxShadow: `0 8px 32px rgba(78,52,46,0.15)`,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: THEME.primary, fontFamily: "Segoe UI" }}>
            Proto<span style={{ color: THEME.accent }}>Board</span>
          </div>
          <div style={{ fontSize: 13, color: "#8D6E63", marginTop: 6, fontFamily: "Segoe UI" }}>
            {isRegister ? "Create your account" : "Sign in to your account"}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 13, color: THEME.primary, fontFamily: "Segoe UI", fontWeight: 600, display: "block", marginBottom: 6 }}>
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: "100%", padding: "10px 12px", marginBottom: 16,
              border: `1.5px solid ${THEME.border}`, borderRadius: 8,
              fontSize: 14, fontFamily: "Segoe UI", outline: "none", boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => e.target.style.borderColor = THEME.accent}
            onBlur={(e) => e.target.style.borderColor = THEME.border}
          />

          <label style={{ fontSize: 13, color: THEME.primary, fontFamily: "Segoe UI", fontWeight: 600, display: "block", marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%", padding: "10px 12px", marginBottom: 20,
              border: `1.5px solid ${THEME.border}`, borderRadius: 8,
              fontSize: 14, fontFamily: "Segoe UI", outline: "none", boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => e.target.style.borderColor = THEME.accent}
            onBlur={(e) => e.target.style.borderColor = THEME.border}
          />

          {error && (
            <div style={{ color: THEME.bad, fontSize: 13, marginBottom: 16, fontFamily: "Segoe UI" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "11px", background: THEME.accent,
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
              color: THEME.primary, cursor: "pointer", fontFamily: "Segoe UI",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#8D6E63", fontFamily: "Segoe UI" }}>
          {isRegister ? "Already have an account?" : "New here?"}{" "}
          <span
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{ color: THEME.accent, cursor: "pointer", fontWeight: 600 }}
          >
            {isRegister ? "Sign in" : "Create account"}
          </span>
        </div>
      </div>
    </div>
  );
}
