import React from "react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: "Medication Tracking",
    desc: "Log and manage all your medications in one place with dosage and schedule details.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: "Smart Reminders",
    desc: "Get email and browser reminders 10 minutes before your scheduled medication time.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "Adherence Analytics",
    desc: "Visualize your medication adherence with charts and track your health consistency.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
    title: "Inventory Management",
    desc: "Track remaining doses and get low stock alerts before you run out of medicine.",
  },
];

const Home = () => {
  const navigate = useNavigate();

  const handleGuestLogin = () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        _id: "guest",
        name: "Guest User",
        email: "guest@meditrack.com",
        isGuest: true,
      })
    );
    navigate("/dashboard");
  };

  // ---------- Styles ----------
  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f9fafb",
      fontFamily: "Inter,Segoe UI,sans-serif",
    },
    header: {
      background: "white",
      borderBottom: "1px solid #e5e7eb",
      padding: "0 40px",
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
    },
    hero: {
      background: "linear-gradient(135deg, #0f766e, #0d9488, #14b8a6)",
      padding: "100px 40px",
      textAlign: "center",
      color: "white",
    },
    section: {
      padding: "80px 40px",
      maxWidth: 1100,
      margin: "auto",
    },
    cta: {
      background: "linear-gradient(135deg, #0f766e, #0d9488)",
      padding: "60px 40px",
      textAlign: "center",
      color: "white",
    },
    footer: {
      background: "#111827",
      color: "#9ca3af",
      textAlign: "center",
      padding: "24px 40px",
      fontSize: 14,
    },
    btnPrimary: {
      background: "linear-gradient(135deg, #0f766e, #0d9488)",
      color: "white",
      border: "none",
      borderRadius: 8,
      padding: "8px 20px",
      fontWeight: 600,
      cursor: "pointer",
    },
    btnOutline: {
      background: "transparent",
      border: "1.5px solid #0d9488",
      color: "#0d9488",
      borderRadius: 8,
      padding: "8px 20px",
      fontWeight: 600,
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <h2 style={{ color: "#111827" }}>MediTrack</h2>

        <div style={{ display: "flex", gap: 12 }}>
          <button style={styles.btnOutline} onClick={() => navigate("/login")}>
            Sign In
          </button>
          <button style={styles.btnPrimary} onClick={() => navigate("/register")}>
            Create Account
          </button>
        </div>
      </header>

      {/* HERO */}
      <section style={styles.hero}>
        <h1 style={{ fontSize: 48, fontWeight: 800 }}>Never Miss a Dose Again</h1>
        <p style={{ maxWidth: 600, margin: "20px auto", opacity: 0.9 }}>
          MediTrack helps you manage medications, reminders, and health tracking in one place.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <button style={{ ...styles.btnPrimary, background: "white", color: "#0d9488" }}
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>

          <button
            onClick={handleGuestLogin}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid white",
              color: "white",
              borderRadius: 8,
              padding: "8px 20px",
              cursor: "pointer",
            }}
          >
            Continue as Guest
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section style={styles.section}>
        <h2 style={{ textAlign: "center", fontSize: 32 }}>Everything you need</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
            marginTop: 40,
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: "white",
                padding: 20,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ marginBottom: 10 }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p style={{ color: "#6b7280", fontSize: 14 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2>Ready to take control of your health?</h2>
        <button
          style={{ marginTop: 20, ...styles.btnPrimary, background: "white", color: "#0d9488" }}
          onClick={() => navigate("/register")}
        >
          Create Free Account
        </button>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <span style={{ color: "#0d9488", fontWeight: 700 }}>MediTrack</span> © 2026
      </footer>
    </div>
  );
};

export default Home;