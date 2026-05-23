import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import * as Icons from './Icons';

const STAGES = [
  { id: 'saved',     label: 'Saved',     color: '#64748b' },
  { id: 'applied',   label: 'Applied',   color: '#4f7cff' },
  { id: 'interview', label: 'Interview', color: '#8b5cf6' },
  { id: 'offer',     label: 'Offer',     color: '#34d399' },
  { id: 'rejected',  label: 'Rejected',  color: '#f87171' },
];

const CATEGORY_LABELS = {
  backend: 'Backend', frontend: 'Frontend', devops: 'DevOps',
  data: 'Data', fullstack: 'Fullstack', other: 'Other',
};

const SOURCE_LABELS = {
  jobstreet: 'JobStreet', linkedin: 'LinkedIn', manual: 'Manual', other: 'Other',
};

const fmt = (ts) => ts
  ? new Date(ts).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

const scoreColor = (s) => s >= 70 ? '#34d399' : s >= 50 ? '#fbbf24' : '#f87171';

const ApplicationDetailsModal = ({ app, onClose, onUpdate, onDelete, updateApplication }) => {
  const [form, setForm] = useState({
    stage: app.stage,
    notes: app.notes || '',
    interview_notes: app.interview_notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stageConf = STAGES.find(s => s.id === form.stage);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateApplication(app.id, form);
      toast.success('Application updated');
      onUpdate(updated);
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await updateApplication(app.id, { deleted_at: new Date().toISOString() });
      toast.success('Application removed');
      onDelete(app.id);
    } catch {
      toast.error('Failed to delete');
      setDeleting(false);
    }
  };

  const textareaStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text)', fontSize: 13,
    resize: 'vertical', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', lineHeight: 1.55,
  };

  return (
    <div className="idm-backdrop" onClick={onClose}>
      <motion.div
        className="idm"
        style={{ maxWidth: 660 }}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="idm-head">
          <div className="idm-head-left">
            <div className="idm-logo" style={{ background: stageConf?.color + '18', color: stageConf?.color, borderColor: stageConf?.color + '40' }}>
              <Icons.IconBriefcase size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              <div className="idm-kicker">
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 10, padding: '3px 9px', borderRadius: 999,
                  background: stageConf?.color + '18', color: stageConf?.color,
                  border: `1px solid ${stageConf?.color}40`,
                  fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: stageConf?.color }} />
                  {stageConf?.label}
                </span>
              </div>
              <h2 className="idm-title">{app.company_name}</h2>
              <div className="idm-sub">
                <b>{app.role_title}</b>
                {app.role_category && <><span>·</span><span>{CATEGORY_LABELS[app.role_category] || app.role_category}</span></>}
                {app.job_source && <><span>·</span><span>{SOURCE_LABELS[app.job_source] || app.job_source}</span></>}
              </div>
            </div>
          </div>
          <button className="idm-close" onClick={onClose} aria-label="Close">
            <Icons.IconX size={15} />
          </button>
        </div>

        <div className="idm-body">
          {/* Timeline */}
          <div className="idm-section">
            <div className="idm-section-head"><Icons.IconCalendar size={13} /> Timeline</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: 'Saved',     value: fmt(app.saved_at) },
                { label: 'Applied',   value: fmt(app.applied_at) },
                { label: 'Interview', value: fmt(app.interview_scheduled_at) },
                { label: 'Offer',     value: fmt(app.offer_received_at) },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, color: value !== '—' ? 'var(--text)' : 'var(--text-dim)', fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Match score */}
          {(app.match_score !== null && app.match_score !== undefined) && (
            <div className="idm-section">
              <div className="idm-section-head"><Icons.IconTarget size={13} /> Match at Apply Time</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{
                  padding: '10px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
                  background: scoreColor(app.match_score) + '14', border: `1px solid ${scoreColor(app.match_score)}30`,
                }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor(app.match_score), fontFamily: "'Space Grotesk', sans-serif" }}>
                    {app.match_score}%
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>match score</span>
                </div>
              </div>
              {(app.matched_skills?.length > 0 || app.missing_skills?.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                  {app.matched_skills?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Matched</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {app.matched_skills.map(s => <span key={s} className="skill-chip skill-pos">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {app.missing_skills?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Missing</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {app.missing_skills.map(s => <span key={s} className="skill-chip skill-miss">{s}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stage selector */}
          <div className="idm-section">
            <div className="idm-section-head"><Icons.IconBriefcase size={13} /> Update Stage</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STAGES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setForm(f => ({ ...f, stage: s.id }))}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${form.stage === s.id ? s.color : 'rgba(120,140,200,0.15)'}`,
                    background: form.stage === s.id ? s.color + '20' : 'transparent',
                    color: form.stage === s.id ? s.color : 'var(--text-mute)',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                >{s.label}</button>
              ))}
            </div>
          </div>

          {/* Source URL */}
          {app.source_url && (
            <div className="idm-section">
              <div className="idm-section-head"><Icons.IconExternalLink size={13} /> Job Posting</div>
              <a href={app.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                View original posting <Icons.IconArrowUpRight size={12} />
              </a>
            </div>
          )}

          {/* Notes */}
          <div className="idm-section">
            <div className="idm-section-head"><Icons.IconDoc size={13} /> Notes</div>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Application notes, contact details, deadlines…"
              rows={3}
              style={textareaStyle}
            />
          </div>

          {/* Interview notes */}
          <div className="idm-section">
            <div className="idm-section-head"><Icons.IconUsers size={13} /> Interview Notes</div>
            <textarea
              value={form.interview_notes}
              onChange={e => setForm(f => ({ ...f, interview_notes: e.target.value }))}
              placeholder="Questions asked, feedback, interviewer names, next steps…"
              rows={4}
              style={textareaStyle}
            />
          </div>

          {/* Footer actions */}
          <div className="idm-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}
              >
                <Icons.IconX size={13} /> Delete application
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>Sure?</span>
                <button onClick={handleDelete} disabled={deleting} className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}>
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm">Cancel</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
                {saving ? 'Saving…' : 'Save changes'} <Icons.IconCheck size={13} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ApplicationDetailsModal;
