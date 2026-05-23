import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from './Icons';

const scoreColor = (s) => s >= 70 ? '#34d399' : s >= 50 ? '#fbbf24' : '#f87171';

const SOURCE_LABELS = {
  linkedin: 'LinkedIn', jobstreet: 'JobStreet', manual: 'Company website',
};

const LogApplicationModal = ({ internship, matchScore, matchedSkills, missingSkills, jobSource, onLog, onCancel }) => {
  const [logging, setLogging] = useState(false);

  const handleLog = async () => {
    setLogging(true);
    try {
      await onLog();
    } finally {
      setLogging(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'grid', placeItems: 'center',
        padding: '24px',
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 20,
          boxShadow: '0 32px 64px -16px rgba(0,0,0,0.65)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 22px 16px',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--accent)',
                marginBottom: 8,
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: 'var(--accent-soft)', display: 'grid', placeItems: 'center',
                }}>
                  <Icons.IconCheck size={11} />
                </span>
                Log to tracker
              </div>
              <h2 style={{
                margin: 0, fontSize: 18, fontWeight: 700,
                color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.015em', lineHeight: 1.2,
              }}>
                Applying to {internship?.company_name}?
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-mute)', lineHeight: 1.5 }}>
                The job opened in a new tab. Log this application to track it.
              </p>
            </div>
            <button
              onClick={onCancel}
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text-mute)', cursor: 'pointer',
                display: 'grid', placeItems: 'center',
              }}
              aria-label="Cancel"
            >
              <Icons.IconX size={14} />
            </button>
          </div>
        </div>

        {/* Application preview */}
        <div style={{ padding: '18px 22px' }}>
          <div style={{
            padding: '14px 16px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            marginBottom: 14,
          }}>
            {/* Company + role */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                  {internship?.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>{internship?.company_name}</span>
                  {jobSource && (
                    <>
                      <span style={{ color: 'var(--text-dim)' }}>·</span>
                      <span>{SOURCE_LABELS[jobSource] || jobSource}</span>
                    </>
                  )}
                </div>
              </div>
              {matchScore !== null && matchScore !== undefined && (
                <div style={{
                  padding: '5px 10px', borderRadius: 8, flexShrink: 0,
                  background: scoreColor(matchScore) + '18',
                  border: `1px solid ${scoreColor(matchScore)}35`,
                  color: scoreColor(matchScore),
                  fontSize: 14, fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {Math.round(matchScore)}%
                </div>
              )}
            </div>

            {/* Stage badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 999,
                background: 'rgba(79,124,255,0.12)',
                border: '1px solid rgba(79,124,255,0.25)',
                color: '#4f7cff', fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4f7cff' }} />
                Applied
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Stage will be set automatically
              </span>
            </div>

            {/* Missing skills */}
            {missingSkills?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                  Missing skills ({missingSkills.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {missingSkills.slice(0, 6).map(s => (
                    <span key={s} className="skill-chip skill-miss">{s}</span>
                  ))}
                  {missingSkills.length > 6 && (
                    <span className="skill-chip">+{missingSkills.length - 6} more</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info note */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 18,
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(79,124,255,0.06)',
            border: '1px solid rgba(79,124,255,0.15)',
          }}>
            <Icons.IconDoc size={13} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.55 }}>
              This will be saved to your <b style={{ color: 'var(--text)' }}>Applications Tracker</b> with your match score and skill data pre-filled.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onCancel}
              className="btn btn-ghost btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Skip for now
            </button>
            <button
              onClick={handleLog}
              disabled={logging}
              className="btn btn-primary btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {logging ? (
                <>
                  <span className="animate-spin" style={{
                    display: 'inline-block', width: 12, height: 12,
                    border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%',
                  }} />
                  Logging…
                </>
              ) : (
                <>Yes, log this <Icons.IconCheck size={13} /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LogApplicationModal;
