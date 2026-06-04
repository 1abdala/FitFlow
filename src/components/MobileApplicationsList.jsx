import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import * as Icons from './Icons';
import ActionButton from './ActionButton';
import ApplicationDetailsModal from './ApplicationDetailsModal';

const STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected'];

const STAGE_COLORS = {
  saved: '#64748b', applied: '#4f7cff', interview: '#8b5cf6',
  offer: '#34d399', rejected: '#f87171',
};

const STAGE_LABELS = {
  saved: 'Saved', applied: 'Applied', interview: 'Interview',
  offer: 'Offer', rejected: 'Rejected',
};

const scoreColor = (s) => s >= 70 ? '#34d399' : s >= 50 ? '#fbbf24' : '#f87171';

const fmt = (ts) => ts
  ? new Date(ts).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
  : null;

const StageBadge = ({ stage }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700,
    background: STAGE_COLORS[stage] + '18',
    color: STAGE_COLORS[stage],
    border: `1px solid ${STAGE_COLORS[stage]}35`,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: STAGE_COLORS[stage] }} />
    {STAGE_LABELS[stage]}
  </span>
);

const ApplicationCard = ({ app, isExpanded, onToggle, onStageChange, updatingId, onOpenDetails }) => {
  const isUpdating = updatingId === app.id;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden',
      borderLeft: `3px solid ${STAGE_COLORS[app.stage]}`,
      transition: 'border-color 0.2s',
    }}>
      {/* Collapsed header — always visible */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: 'var(--surface-3)', color: 'var(--text)',
          display: 'grid', placeItems: 'center',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
          border: '1px solid var(--border)',
        }}>
          {app.company_name.slice(0, 2).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{app.company_name}</span>
            <StageBadge stage={app.stage} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {app.role_title}
            {app.applied_at && <span style={{ color: 'var(--text-dim)' }}> · {fmt(app.applied_at)}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {app.match_score !== null && app.match_score !== undefined && (
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
              background: scoreColor(app.match_score) + '18', color: scoreColor(app.match_score),
            }}>{app.match_score}%</span>
          )}
          <Icons.IconArrowRight size={14} style={{
            color: 'var(--text-dim)',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }} />
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 18px 18px' }}>
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

              {/* Skills */}
              {(app.matched_skills?.length > 0 || app.missing_skills?.length > 0) && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
                  {app.matched_skills?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Matched</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {app.matched_skills.slice(0, 4).map(s => <span key={s} className="skill-chip skill-pos">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {app.missing_skills?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Missing</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {app.missing_skills.slice(0, 4).map(s => <span key={s} className="skill-chip skill-miss">{s}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stage buttons */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Move to stage</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 6 }}>
                  {STAGES.map(stage => (
                    <ActionButton
                      key={stage}
                      stage={stage}
                      isActive={app.stage === stage}
                      loading={isUpdating && app.stage !== stage}
                      onClick={() => app.stage !== stage && onStageChange(app, stage)}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onOpenDetails(app)} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  <Icons.IconDoc size={13} /> Edit details
                </button>
                {app.source_url && (
                  <a href={app.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                    <Icons.IconExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SORT_OPTIONS = ['Newest', 'Oldest', 'Best match'];
const FILTER_STAGES = ['All', 'Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];

const MobileApplicationsList = ({ applications, setApplications, updateApplication }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStage, setFilterStage] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  const handleToggle = (id) => setExpandedId(prev => prev === id ? null : id);

  const handleStageChange = async (app, newStage) => {
    const prev = [...applications];
    setUpdatingId(app.id);
    setApplications(apps => apps.map(a => a.id === app.id ? { ...a, stage: newStage } : a));
    try {
      await updateApplication(app.id, { stage: newStage });
      toast.success(`Moved to ${newStage}`);
    } catch {
      setApplications(prev);
      toast.error('Failed to update. Try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = applications
    .filter(a => filterStage === 'All' || a.stage === filterStage.toLowerCase())
    .sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'Oldest') return new Date(a.created_at) - new Date(b.created_at);
      return (b.match_score || 0) - (a.match_score || 0);
    });

  return (
    <>
      {/* Filter + Sort toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center', minWidth: 0 }}>
        <div style={{ 
          display: 'flex', 
          gap: 6, 
          flex: 1, 
          overflowX: 'auto', 
          flexWrap: 'nowrap',
          paddingBottom: 4,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }} className="no-scrollbar">
          {FILTER_STAGES.map(f => (
            <button
              key={f}
              onClick={() => setFilterStage(f)}
              className={`m-filter ${filterStage === f ? 'm-filter-on' : ''}`}
              style={{ padding: '6px 12px', fontSize: 12, flexShrink: 0 }}
            >{f}</button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 12, cursor: 'pointer',
          }}
        >
          {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-dim)' }}>
          <Icons.IconBriefcase size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No applications</div>
          <div style={{ fontSize: 12 }}>
            {filterStage === 'All' ? 'Add your first application to get started.' : `No applications in "${filterStage}" stage.`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              isExpanded={expandedId === app.id}
              onToggle={() => handleToggle(app.id)}
              onStageChange={handleStageChange}
              updatingId={updatingId}
              onOpenDetails={setSelectedApp}
            />
          ))}
        </div>
      )}

      {/* Details modal */}
      <AnimatePresence>
        {selectedApp && (
          <ApplicationDetailsModal
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onUpdate={updated => {
              setApplications(apps => apps.map(a => a.id === updated.id ? updated : a));
              setSelectedApp(null);
            }}
            onDelete={id => {
              setApplications(apps => apps.filter(a => a.id !== id));
              setSelectedApp(null);
            }}
            updateApplication={updateApplication}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileApplicationsList;
