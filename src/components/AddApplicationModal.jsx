import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import * as Icons from './Icons';

const CATEGORIES = [
  { value: '', label: 'Select category…' },
  { value: 'backend',  label: 'Backend' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'fullstack',label: 'Fullstack' },
  { value: 'devops',   label: 'DevOps' },
  { value: 'data',     label: 'Data' },
  { value: 'other',    label: 'Other' },
];

const SOURCES = [
  { value: '',          label: 'Select source…' },
  { value: 'jobstreet', label: 'JobStreet' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'manual',    label: 'Manual / Company website' },
  { value: 'other',     label: 'Other' },
];

const EMPTY = {
  company_name: '', role_title: '', role_category: '', job_source: '',
  source_url: '', match_score: '', matched_skills: '', missing_skills: '', notes: '',
};

const fieldStyle = {
  width: '100%', padding: '10px 12px',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: 'var(--text-dim)', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: 6,
};

const Field = ({ label, error, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
    {error && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{error}</div>}
  </div>
);

const AddApplicationModal = ({ onClose, onAdded, createApplication }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.company_name.trim() || form.company_name.trim().length < 2)
      errs.company_name = 'Company name must be at least 2 characters.';
    if (!form.role_title.trim() || form.role_title.trim().length < 3)
      errs.role_title = 'Role title must be at least 3 characters.';
    if (form.match_score !== '' && (isNaN(Number(form.match_score)) || Number(form.match_score) < 0 || Number(form.match_score) > 100))
      errs.match_score = 'Match score must be 0–100.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        company_name: form.company_name.trim(),
        role_title: form.role_title.trim(),
        role_category: form.role_category || null,
        job_source: form.job_source || null,
        source_url: form.source_url.trim() || null,
        match_score: form.match_score !== '' ? Number(form.match_score) : null,
        matched_skills: form.matched_skills
          ? form.matched_skills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        missing_skills: form.missing_skills
          ? form.missing_skills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        notes: form.notes.trim() || null,
        stage: 'saved',
      };

      const created = await createApplication(payload);
      toast.success('Application added!');
      onAdded(created);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to add application');
    } finally {
      setSaving(false);
    }
  };

  const inputProps = (key) => ({
    style: fieldStyle,
    value: form[key],
    onChange: e => set(key, e.target.value),
  });

  return (
    <div className="idm-backdrop" onClick={onClose}>
      <motion.div
        style={{
          width: '100%', maxWidth: 580,
          background: 'var(--surface)', borderRadius: 20,
          border: '1px solid var(--border-strong)',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 64px)',
        }}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif" }}>
              Add Application
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-mute)' }}>
              Track an application submitted externally
            </p>
          </div>
          <button className="idm-close" onClick={onClose} aria-label="Close">
            <Icons.IconX size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Company Name *" error={errors.company_name}>
              <input ref={firstRef} {...inputProps('company_name')} placeholder="e.g. Grab, Maybank" />
            </Field>
            <Field label="Role Title *" error={errors.role_title}>
              <input {...inputProps('role_title')} placeholder="e.g. Software Engineer Intern" />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Category">
              <select {...inputProps('role_category')} style={{ ...fieldStyle, cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Job Source">
              <select {...inputProps('job_source')} style={{ ...fieldStyle, cursor: 'pointer' }}>
                {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Job Posting URL">
            <input {...inputProps('source_url')} type="url" placeholder="https://..." />
          </Field>

          <Field label="Match Score (0–100)" error={errors.match_score}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range" min="0" max="100"
                value={form.match_score || 0}
                onChange={e => set('match_score', e.target.value)}
                style={{ flex: 1, accentColor: 'var(--accent)' }}
              />
              <input
                {...inputProps('match_score')}
                type="number" min="0" max="100"
                placeholder="—"
                style={{ ...fieldStyle, width: 64, textAlign: 'center' }}
              />
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Matched Skills">
              <input {...inputProps('matched_skills')} placeholder="React, Node.js, SQL (comma-separated)" />
            </Field>
            <Field label="Missing Skills">
              <input {...inputProps('missing_skills')} placeholder="Docker, Kubernetes (comma-separated)" />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              {...inputProps('notes')}
              placeholder="Recruiter contact, deadlines, anything relevant…"
              rows={3}
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.55 }}
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Adding…' : 'Add application'} <Icons.IconCheck size={13} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddApplicationModal;
