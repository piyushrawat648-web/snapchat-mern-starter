import { useState } from "react";
import api from "../api";

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const { data } = await api.post(endpoint, form);
      onAuthenticated(data.token);
    } catch (err) {
      setError(err.response?.data?.message || "Could not authenticate");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <form className="panel auth-panel" onSubmit={submit}>
        <div className="brand-dot large">●</div>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted">Sign in to create and view stories.</p>
        {mode === "register" && (
          <input
            required
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        )}
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          required
          minLength="8"
          type="password"
          placeholder="Password (8+ characters)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="error">{error}</p>}
        <button className="button primary" disabled={busy}>
          {busy ? "Please wait..." : mode === "login" ? "Log in" : "Register"}
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already registered? Log in"}
        </button>
      </form>
    </main>
  );
}
