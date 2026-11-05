"use client";
import { useState, useEffect, useRef } from "react";
import { T } from "../lib/store";

const AVATARS = [
  { id: "male1", name: "Michael", image: "https://api.dicebear.com/7.x/micah/svg?seed=Michael" },
  { id: "male2", name: "James", image: "https://api.dicebear.com/7.x/micah/svg?seed=James" },
  { id: "male3", name: "David", image: "https://api.dicebear.com/7.x/micah/svg?seed=David" },
  { id: "female1", name: "Boyd", image: "https://api.dicebear.com/7.x/micah/svg?seed=Sarah" },
  { id: "female2", name: "Emma", image: "https://api.dicebear.com/7.x/micah/svg?seed=Emma" },
  { id: "female3", name: "Lisa", image: "https://api.dicebear.com/7.x/micah/svg?seed=Lisa" },
];

export default function AvatarSelector({ currentAvatar, onSelect, onClose }) {
  const [selected, setSelected] = useState(currentAvatar || "male1");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSelect = (avatarId) => {
    setSelected(avatarId);
    onSelect(avatarId);
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        marginTop: 10,
        width: 280,
        background: T.card,
        borderRadius: 16,
        border: `1px solid ${T.line}`,
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        zIndex: 1000,
        overflow: "hidden",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${T.line}`,
        fontSize: 14,
        fontWeight: 700,
        color: T.text,
        background: T.card2,
        textAlign: "center",
      }}>
        Choose Avatar
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        padding: 16,
      }}>
        {AVATARS.map((avatar) => (
          <div
            key={avatar.id}
            onClick={() => handleSelect(avatar.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "10px 8px",
              borderRadius: 12,
              cursor: "pointer",
              background: selected === avatar.id ? "rgba(0,229,176,0.1)" : "transparent",
              border: selected === avatar.id ? `1px solid ${T.acc}` : `1px solid transparent`,
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                overflow: "hidden",
                border: selected === avatar.id ? `2px solid ${T.acc}` : "none",
              }}
            >
              <img
                src={avatar.image}
                alt={avatar.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: T.text, fontWeight: 500 }}>{avatar.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}