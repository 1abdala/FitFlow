import React from 'react';

const STAGE_CONFIG = {
  saved:     { label: 'Saved',     color: '#64748b' },
  applied:   { label: 'Applied',   color: '#4f7cff' },
  interview: { label: 'Interview', color: '#8b5cf6' },
  offer:     { label: 'Offer',     color: '#34d399' },
  rejected:  { label: 'Rejected',  color: '#f87171' },
};

const ActionButton = ({ stage, isActive, onClick, loading = false }) => {
  const cfg = STAGE_CONFIG[stage];
  if (!cfg) return null;

  return (
    <button
      onClick={onClick}
      disabled={loading || isActive}
      aria-pressed={isActive}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 14px', minHeight: 44, flex: 1,
        borderRadius: 8,
        border: `1px solid ${isActive ? cfg.color : 'rgba(120,140,200,0.15)'}`,
        background: isActive ? cfg.color + '20' : 'transparent',
        color: isActive ? cfg.color : 'rgba(238,242,255,0.5)',
        fontSize: 12, fontWeight: 600,
        cursor: isActive ? 'default' : 'pointer',
        transition: 'all 0.15s ease',
        opacity: loading ? 0.6 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? (
        <span className="animate-spin" style={{
          display: 'inline-block', width: 11, height: 11, flexShrink: 0,
          border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%',
        }} />
      ) : (
        <span style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: isActive ? cfg.color : 'rgba(120,140,200,0.35)',
        }} />
      )}
      {cfg.label}
    </button>
  );
};

export default ActionButton;
