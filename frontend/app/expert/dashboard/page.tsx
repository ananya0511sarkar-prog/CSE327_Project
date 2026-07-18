"use client";

import { useState } from "react";

export default function TestPage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      backgroundColor: "#ff007f", // Hot Pink
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "3rem", margin: "0 0 20px 0" }}>
        🚨 TEST PAGE ACTIVE 🚨
      </h1>
      <p style={{ fontSize: "1.5rem", marginBottom: "30px" }}>
        If you see this bright pink screen, you are editing the **correct** file!
      </p>
      
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: "15px 30px",
          fontSize: "1.25rem",
          fontWeight: "bold",
          cursor: "pointer",
          backgroundColor: "white",
          color: "#ff007f",
          border: "none",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}
      >
        Clicks: {count}
      </button>
    </div>
  );
}