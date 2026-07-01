import React, { useState } from "react";
import { Link } from "react-router-dom";

function RecipeCard({ id, image, title, cookTime, serves, category, accentColor = "#e8b84b" }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: hovered ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${accentColor}30`,
        borderRadius: "16px",
        overflow: "hidden",
        transition: "all 0.3s ease",
        cursor: "pointer",
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
        boxShadow: hovered ? `0 12px 32px ${accentColor}33` : "none",
        fontFamily: "Poppins, sans-serif",
        height: "100%",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: "100%",
          height: "200px",
          backgroundColor: `${accentColor}20`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src={image}
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease",
            transform: hovered ? "scale(1.05)" : "scale(1)",
          }}
        />
      </div>

      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {category && (
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              opacity: 0.8,
              fontWeight: "600",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              color: accentColor,
            }}
          >
            {category}
          </p>
        )}

        <h4
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "bold",
            color: "#fff",
            lineHeight: "1.3",
          }}
        >
          {title}
        </h4>

        <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
          {cookTime && <span>Time {cookTime}</span>}
          {cookTime && serves && " - "}
          {serves && <span>Serves {serves}</span>}
        </p>

        <Link
          to={`/recipe/${id}`}
          style={{
            marginTop: "8px",
            color: accentColor,
            fontSize: "14px",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.2s ease",
            display: "inline-block",
            opacity: hovered ? 0.85 : 1,
          }}
        >
          View Recipe -&gt;
        </Link>
      </div>
    </div>
  );
}

export default RecipeCard;
