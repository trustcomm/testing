import React from "react";
import { Hold } from "../components/d-chat";

// S11 "Toh aaj hi apne hosting wale se ek sawaal pucho: 'Kya PHP update ho gaya?' Naye versions screen pe hain."
// The chat with the host types the question; on "Naye versions screen pe hain" the glass panel with the safe versions slides up and HOLDS (>= 75 frames),
// across the S11/S12 boundary (S12 draws the same panel, see S12.tsx) until S12's cards arrive on "plugin update".
export const S11: React.FC = () => <Hold />;
