// Inline SVG icons — single stroke style
const Icon = ({ d, size = 20, fill = "none", stroke = "currentColor", strokeWidth = 1.75, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

const IconSparkle = (p) => <Icon {...p}><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4L12 3z"/><path d="M19 14l.7 1.8L21.5 16.5l-1.8.7L19 19l-.7-1.8L16.5 16.5l1.8-.7L19 14z"/></Icon>;
const IconArrowRight = (p) => <Icon d="M5 12h14M13 6l6 6-6 6" {...p} />;
const IconArrowUpRight = (p) => <Icon d="M7 17L17 7M9 7h8v8" {...p} />;
const IconChip = (p) => <Icon {...p}><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></Icon>;
const IconTarget = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></Icon>;
const IconBriefcase = (p) => <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/></Icon>;
const IconGrid = (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Icon>;
const IconDoc = (p) => <Icon {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></Icon>;
const IconCap = (p) => <Icon {...p}><path d="M2 9l10-5 10 5-10 5L2 9z"/><path d="M6 11v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5"/></Icon>;
const IconBook = (p) => <Icon {...p}><path d="M4 4h7v16H6a2 2 0 01-2-2V4z"/><path d="M20 4h-7v16h5a2 2 0 002-2V4z"/></Icon>;
const IconGear = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008.91 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8.91a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></Icon>;
const IconBell = (p) => <Icon d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.46 0" {...p} />;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>;
const IconStar = (p) => <Icon d="M12 2l3 7 7.5.6-5.7 5L18.5 22 12 18l-6.5 4 1.7-7.4L1.5 9.6 9 9l3-7z" {...p} />;
const IconWave = (p) => <Icon {...p}><path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/></Icon>;
const IconCheck = (p) => <Icon d="M4 12l5 5L20 6" {...p} />;
const IconLogout = (p) => <Icon {...p}><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></Icon>;
const IconLogo = (p) => <Icon {...p}><path d="M3 17l4-4 3 3 5-6 6 6"/><circle cx="20" cy="16" r="1.5" fill="currentColor"/></Icon>;
const IconBolt = (p) => <Icon d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" {...p} />;
const IconShield = (p) => <Icon d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" {...p} />;
const IconUsers = (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 11.5a3 3 0 100-6M22 19.5a5 5 0 00-4-4.9"/></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;

window.FFIcons = { IconSparkle, IconArrowRight, IconArrowUpRight, IconChip, IconTarget, IconBriefcase, IconGrid, IconDoc, IconCap, IconBook, IconGear, IconBell, IconSearch, IconStar, IconWave, IconCheck, IconLogout, IconLogo, IconBolt, IconShield, IconUsers, IconClock };
