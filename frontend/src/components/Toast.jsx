import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Toast = ({ message, type = "info", duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      minWidth: "300px",
      maxWidth: "500px",
      padding: "16px 20px",
      borderRadius: "12px",
      color: "#fff",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
    };

    const typeStyles = {
      success: {
        background: "rgba(232, 184, 75, 0.15)",
        border: "1px solid rgba(232, 184, 75, 0.3)",
      },
      error: {
        background: "rgba(239, 68, 68, 0.15)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      },
      warning: {
        background: "rgba(255, 152, 0, 0.15)",
        border: "1px solid rgba(255, 152, 0, 0.3)",
      },
      info: {
        background: "rgba(33, 150, 243, 0.15)",
        border: "1px solid rgba(33, 150, 243, 0.3)",
      },
    };

    return {
      ...baseStyles,
      ...(typeStyles[type] || typeStyles.info),
    };
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "OK";
      case "error":
        return "X";
      case "warning":
        return "!";
      case "info":
        return "i";
      default:
        return "i";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        style={getToastStyles()}
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <span style={{ fontSize: "20px" }}>{getIcon()}</span>
        <span style={{ flex: 1, lineHeight: "1.4" }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "18px",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
            e.currentTarget.style.background = "none";
          }}
        >
          x
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default Toast;
