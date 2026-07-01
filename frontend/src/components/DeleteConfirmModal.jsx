import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DeleteConfirmModal({ open, title = "Delete Recipe?", message = "This action cannot be undone.", onCancel, onConfirm }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            style={{
              width: "min(420px, 100%)",
              background: "rgba(20,20,20,0.96)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "16px",
              padding: "24px",
              color: "#fff",
              boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
            }}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: "24px" }}>{title}</h3>
            <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,0.72)" }}>{message}</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(239,68,68,0.45)",
                  background: "rgba(239,68,68,0.22)",
                  color: "rgba(255,120,120,1)",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Delete Permanently
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
