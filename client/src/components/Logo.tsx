import React from 'react';

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Fantasy Politics logo"
    >
      {/* Coin base — deep navy with red-to-blue gradient rim */}
      <defs>
        <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cc2936" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#040d1f" stroke="url(#rimGrad)" strokeWidth="3.5" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#111e44" strokeWidth="1.2" strokeDasharray="4 3" />

      {/* Dollar sign watermark */}
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontSize="52"
        fontFamily="Georgia, serif"
        fontWeight="bold"
        fill="#0c1835"
        opacity="0.9"
      >
        $
      </text>

      {/*
        Combined donkey-elephant silhouette.
        Left half = donkey (long ears, slender neck)
        Right half = elephant (trunk curling down, large ear)
        They share one body.
      */}
      <g fill="#e03545" stroke="#9b1c1c" strokeWidth="0.8">

        {/* Shared body */}
        <ellipse cx="50" cy="60" rx="22" ry="14" />

        {/* ── DONKEY side (left) ── */}
        {/* Donkey head */}
        <ellipse cx="32" cy="46" rx="9" ry="7" />
        {/* Donkey snout */}
        <ellipse cx="24" cy="49" rx="5" ry="3.5" />
        {/* Donkey long ear left */}
        <ellipse cx="28" cy="34" rx="2.5" ry="7" transform="rotate(-10 28 34)" />
        {/* Donkey long ear right */}
        <ellipse cx="34" cy="32" rx="2.5" ry="7" transform="rotate(5 34 32)" />
        {/* Donkey eye */}
        <circle cx="29" cy="45" r="1.2" fill="#040d1f" stroke="none" />
        {/* Donkey neck connection */}
        <rect x="33" y="50" width="8" height="8" rx="3" />
        {/* Donkey tail (left side, curly) */}
        <path d="M28 68 Q20 65 22 58 Q24 52 28 55" fill="none" stroke="#3b6ef8" strokeWidth="2" strokeLinecap="round" />

        {/* ── ELEPHANT side (right) ── */}
        {/* Elephant head */}
        <ellipse cx="68" cy="44" rx="11" ry="10" />
        {/* Elephant big ear */}
        <ellipse cx="80" cy="42" rx="7" ry="10" opacity="0.85" />
        {/* Elephant trunk curling down */}
        <path d="M61 50 Q55 60 58 68 Q60 72 64 70" fill="none" stroke="#3b6ef8" strokeWidth="4" strokeLinecap="round" />
        {/* Elephant tusk */}
        <path d="M62 52 Q57 56 58 62" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        {/* Elephant eye */}
        <circle cx="71" cy="42" r="1.4" fill="#040d1f" stroke="none" />
        {/* Elephant neck connection */}
        <rect x="59" y="50" width="8" height="8" rx="3" />

        {/* Shared legs (4, centered under body) */}
        <rect x="34" y="70" width="6" height="10" rx="2" />
        <rect x="42" y="72" width="6" height="10" rx="2" />
        <rect x="51" y="72" width="6" height="10" rx="2" />
        <rect x="59" y="70" width="6" height="10" rx="2" />
      </g>
    </svg>
  );
}
