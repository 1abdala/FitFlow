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

        <div className="idm-body custom-scrollbar">
          {/* Timeline */}
          <div className="idm-section">
            <div className="idm-section-head"><Icons.IconCalendar size={13} /> Timeline</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
              {[
                { label: 'Saved',     value: fmt(app.saved_at) },
                { label: 'Applied',   value: fmt(app.applied_at) },
                { label: 'Interview', value: fmt(app.interview_scheduled_at) },
                { label: 'Offer',     value: fmt(app.offer_received_at) },
              ].map(({ label, value }) => (
                <div key={label} className="idm-skill-card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 12, color: value !== '—' ? 'var(--text)' : 'var(--text-dim)', fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Match score & Skills */}
          {(app.match_score !== null && app.match_score !== undefined) && (
            <div className="idm-section">
              <div className="idm-section-head"><Icons.IconTarget size={13} /> Match at Apply Time</div>
              
              <div className="idm-skills-grid">
                <div className="idm-skill-card idm-skill-pos" style={{ padding: '16px' }}>
                  <div className="idm-skill-head">
                    <span className="idm-skill-icon"><Icons.IconCheck size={13} /></span>
                    Match Score
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32, fontWeight: 700, color: scoreColor(app.match_score), fontFamily: "'Space Grotesk', sans-serif" }}>
                      {app.match_score}%
                    </span>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                      Based on your profile when you saved this role.
                    </div>
                  </div>
                </div>

                {(app.matched_skills?.length > 0 || app.missing_skills?.length > 0) && (
                  <div className="idm-skill-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px' }}>
                     {app.matched_skills?.length > 0 && (
                        <div>
                           <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Matched Skills</div>
                           <div className="idm-chip-row">
                             {app.matched_skills.map(s => <span key={s} className="skill-chip skill-pos">{s}</span>)}
                           </div>
                        </div>
                     )}
                     {app.missing_skills?.length > 0 && (
                        <div>
                           <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8, marginTop: app.matched_skills?.length ? 4 : 0 }}>Missing Skills</div>
                           <div className="idm-chip-row">
                             {app.missing_skills.map(s => <span key={s} className="skill-chip skill-miss">{s}</span>)}
                           </div>
                        </div>
                     )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Update Stage */}
          <div className="idm-section">
            <div className="idm-section-head"><Icons.IconBriefcase size={13} /> Update Stage</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
              {STAGES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setForm(f => ({ ...f, stage: s.id }))}
                  className={`btn ${form.stage === s.id ? '' : 'btn-ghost'}`}
                  style={{
                    padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: form.stage === s.id ? s.color + '15' : 'var(--surface-2)',
                    color: form.stage === s.id ? s.color : 'var(--text-mute)',
                    border: `1px solid ${form.stage === s.id ? s.color + '40' : 'var(--border)'}`,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, opacity: form.stage === s.id ? 1 : 0.4 }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Job Source */}
          {app.source_url && (
            <div className="idm-section">
              <div className="idm-section-head"><Icons.IconExternalLink size={13} /> Job Posting</div>
              <a href={app.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ background: 'var(--surface-2)' }}>
                View Original Posting <Icons.IconArrowUpRight size={14} />
              </a>
            </div>
          )}

          {/* Notes */}
          <div className="idm-section">
            <div className="idm-section-head"><Icons.IconDoc size={13} /> Notes</div>
            <div className="input-wrap" style={{ alignItems: 'flex-start' }}>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Write down any notes about the company, role, or application process..."
                style={{ width: '100%', minHeight: 90, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, resize: 'vertical', outline: 'none' }}
              />
            </div>
          </div>

          {/* Interview Notes */}
          <div className="idm-section">
            <div className="idm-section-head"><Icons.IconUsers size={13} /> Interview Notes</div>
            <div className="input-wrap" style={{ alignItems: 'flex-start' }}>
              <textarea
                value={form.interview_notes}
                onChange={(e) => setForm(f => ({ ...f, interview_notes: e.target.value }))}
                placeholder="What did they ask? Who did you speak with?..."
                style={{ width: '100%', minHeight: 90, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, resize: 'vertical', outline: 'none' }}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="idm-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <div>
            {confirmDelete ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 500 }}>Delete this app?</span>
                <button onClick={handleDelete} disabled={deleting} className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}>
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-mute)' }}>
                Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm px-6">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default ApplicationDetailsModal;
