// Hand-drawn style SVG icons - imperfect, human, warm

export const RunIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Running figure - sketchy style */}
    <circle cx="14" cy="5" r="2.5" strokeWidth="1.8" />
    <path d="M8 21c1-2 2.5-4 4-5.5" strokeWidth="2.2" />
    <path d="M12 15.5c1.5-2 3-3.5 5-4" strokeWidth="2" />
    <path d="M6.5 12c2-0.5 3.5 0 5 1.5" strokeWidth="2.2" />
    <path d="M11.5 13.5c0.5 1.5 0.5 3 0 4.5" strokeWidth="1.8" />
    <path d="M17 11.5l2 3.5" strokeWidth="2" />
    <path d="M5 16l2-1" strokeWidth="2" />
  </svg>
);

export const HeartIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Hand-drawn heart - slightly wobbly */}
    <path d="M12 20c-1-1-7-5.5-7-10.5 0-3 2-5 4.5-5 1.5 0 2.5 0.8 3.5 2 1-1.2 2-2 3.5-2 2.5 0 4.5 2 4.5 5 0 5-6 9.5-7 10.5" strokeWidth="2.2" />
  </svg>
);

export const HomeIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Sketchy house */}
    <path d="M3 10.5L12 4l9 6.5" strokeWidth="2.2" />
    <path d="M5 9.5v10c0 0.5 0.3 1 1 1h12c0.7 0 1-0.5 1-1v-10" strokeWidth="2" />
    <path d="M9 20.5v-6c0-0.5 0.5-1 1-1h4c0.5 0 1 0.5 1 1v6" strokeWidth="1.8" />
  </svg>
);

export const CarIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Sketchy car */}
    <path d="M5 15c-1 0-2-0.5-2-1.5v-2c0-1 0.5-1.5 1.5-1.5h1l1.5-3c0.5-1 1.5-1.5 2.5-1.5h5c1 0 2 0.5 2.5 1.5l1.5 3h1c1 0 1.5 0.5 1.5 1.5v2c0 1-1 1.5-2 1.5" strokeWidth="2" />
    <circle cx="7" cy="16" r="2" strokeWidth="2.2" />
    <circle cx="17" cy="16" r="2" strokeWidth="2.2" />
    <path d="M7 10h10" strokeWidth="1.5" />
  </svg>
);

export const WalkIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Walking person - casual */}
    <circle cx="12" cy="5" r="2.5" strokeWidth="1.8" />
    <path d="M10 21l1.5-6" strokeWidth="2.2" />
    <path d="M14 21l-1.5-6" strokeWidth="2.2" />
    <path d="M12.5 15l-0.5-5" strokeWidth="2" />
    <path d="M8 12c1-1 2.5-1.5 4-1" strokeWidth="2" />
    <path d="M16 11c-1-0.5-2.5-0.5-4 0" strokeWidth="2" />
  </svg>
);

export const MeetingIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Two people - sketchy */}
    <circle cx="8" cy="7" r="2.5" strokeWidth="1.8" />
    <circle cx="16" cy="7" r="2.5" strokeWidth="1.8" />
    <path d="M4 19c0-3 2-5 4-5 1.5 0 2.5 0.5 3 1.5" strokeWidth="2" />
    <path d="M20 19c0-3-2-5-4-5-1.5 0-2.5 0.5-3 1.5" strokeWidth="2" />
  </svg>
);

export const MoonIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Crescent moon with stars - whimsical */}
    <path d="M20 12c0 5-4 8-9 8-4 0-7-3-7-7 0-5 4-9 9-9 0 3 2 5 4 6 2 1 3 1.5 3 2z" strokeWidth="2.2" />
    <circle cx="18" cy="6" r="0.8" fill={color} />
    <circle cx="15" cy="4" r="0.5" fill={color} />
  </svg>
);

export const PencilIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Sketchy pencil */}
    <path d="M16 3l5 5-12 12H4v-5L16 3z" strokeWidth="2" />
    <path d="M13 6l5 5" strokeWidth="1.8" />
    <path d="M4 20l3-1" strokeWidth="2.2" />
  </svg>
);

// Simple face expressions for moods
export const FaceGreat = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Big smile face */}
    <circle cx="16" cy="16" r="13" strokeWidth="2.2" />
    <circle cx="11" cy="13" r="1.5" fill={color} />
    <circle cx="21" cy="13" r="1.5" fill={color} />
    <path d="M10 19c2 3 4 4 6 4s4-1 6-4" strokeWidth="2.5" />
  </svg>
);

export const FaceGood = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Soft smile */}
    <circle cx="16" cy="16" r="13" strokeWidth="2.2" />
    <circle cx="11" cy="14" r="1.5" fill={color} />
    <circle cx="21" cy="14" r="1.5" fill={color} />
    <path d="M11 20c2 2 3 2.5 5 2.5s3-0.5 5-2.5" strokeWidth="2.5" />
  </svg>
);

export const FaceOkay = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Neutral face */}
    <circle cx="16" cy="16" r="13" strokeWidth="2.2" />
    <circle cx="11" cy="14" r="1.5" fill={color} />
    <circle cx="21" cy="14" r="1.5" fill={color} />
    <path d="M11 21h10" strokeWidth="2.5" />
  </svg>
);

export const FaceLow = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Slight frown */}
    <circle cx="16" cy="16" r="13" strokeWidth="2.2" />
    <circle cx="11" cy="14" r="1.5" fill={color} />
    <circle cx="21" cy="14" r="1.5" fill={color} />
    <path d="M11 22c2-1.5 3-2 5-2s3 0.5 5 2" strokeWidth="2.5" />
  </svg>
);

export const FaceRough = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Sad face */}
    <circle cx="16" cy="16" r="13" strokeWidth="2.2" />
    <circle cx="11" cy="14" r="1.5" fill={color} />
    <circle cx="21" cy="14" r="1.5" fill={color} />
    <path d="M10 23c2-3 4-4 6-4s4 1 6 4" strokeWidth="2.5" />
  </svg>
);

// Activity icon mapping
export const ActivityIcons = {
  run: RunIcon,
  date: HeartIcon,
  showing: HomeIcon,
  ride: CarIcon,
  walking: WalkIcon,
  meeting: MeetingIcon,
  nightout: MoonIcon,
  custom: PencilIcon,
};

// Mood face mapping
export const MoodFaces = {
  great: FaceGreat,
  good: FaceGood,
  okay: FaceOkay,
  low: FaceLow,
  rough: FaceRough,
};
