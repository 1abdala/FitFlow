import React, { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as Icons from './Icons';
import ApplicationDetailsModal from './ApplicationDetailsModal';

const STAGES = [
  { id: 'saved',     label: 'Saved',     color: '#64748b' },
  { id: 'applied',   label: 'Applied',   color: '#4f7cff' },
  { id: 'interview', label: 'Interview', color: '#8b5cf6' },
  { id: 'offer',     label: 'Offer',     color: '#34d399' },
  { id: 'rejected',  label: 'Rejected',  color: '#f87171' },
];

const scoreColor = (s) => {
  if (s === null || s === undefined) return 'var(--text-dim)';
  return s >= 70 ? '#34d399' : s >= 50 ? '#fbbf24' : '#f87171';
};

const fmt = (ts) => ts
  ? new Date(ts).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
  : null;

/* Static card — used inside DragOverlay */
const CardContent = ({ app, dim = false }) => (
  <div style={{
    padding: '13px 14px',
    background: dim ? 'var(--surface-3)' : 'var(--surface-2)',
    border: '1px solid var(--border-strong)',
    borderRadius: 11,
    display: 'flex', flexDirection: 'column', gap: 7,
    boxShadow: dim ? '0 20px 48px -10px rgba(0,0,0,0.55)' : undefined,
    userSelect: 'none',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
        }}>{app.company_name}</div>
        <div style={{
          fontSize: 11, color: 'var(--text-mute)', marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{app.role_title}</div>
      </div>
      {app.match_score !== null && app.match_score !== undefined && (
        <span style={{
          padding: '3px 7px', borderRadius: 5, flexShrink: 0,
          background: scoreColor(app.match_score) + '1e',
          color: scoreColor(app.match_score),
          fontSize: 10, fontWeight: 700,
        }}>{app.match_score}%</span>
      )}
    </div>

    {app.missing_skills?.length > 0 ? (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
        <span className="skill-chip skill-miss" style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
          {app.missing_skills[0]}
        </span>
      </div>
    ) : app.matched_skills?.length > 0 ? (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
        <span className="skill-chip" style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
          {app.matched_skills[0]}
        </span>
      </div>
    ) : null}

    {(app.applied_at || app.saved_at) && (
      <div style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
        <Icons.IconClock size={10} />
        {fmt(app.applied_at || app.saved_at)}
      </div>
    )}
  </div>
);

/* Draggable card wrapper */
const DraggableCard = ({ app, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        padding: 0, borderRadius: 12,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative',
        transition: isDragging ? undefined : 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0,0,0,0.5)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--border)';
        }
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => { if (!isDragging) onClick(e); }}
    >
      <CardContent app={app} />
    </div>
  );
};

/* Droppable column */
const KanbanColumn = ({ stage, apps, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: isOver ? 'rgba(79,124,255,0.04)' : 'var(--surface)',
      border: `1px solid ${isOver ? 'rgba(79,124,255,0.35)' : 'var(--border)'}`,
      borderRadius: 14, overflow: 'hidden',
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      {/* Column header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <span style={{ color: stage.color, fontSize: 14 }}>●</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1, letterSpacing: '0.02em' }}>{stage.label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)' }}>{apps.length}</span>
      </div>

      {/* Drop zone + cards */}
      <div
        ref={setNodeRef}
        className="no-scrollbar"
        style={{
          flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
          overflowY: 'auto',
        }}
      >
        {apps.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', padding: '32px 16px',
            border: `1px dashed ${isOver ? stage.color + '60' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: 10, transition: 'border-color 0.15s',
          }}>
            {stage.id === 'interview' ? (
              <>
                <Icons.IconCalendar size={24} style={{ color: 'var(--text-dim)', marginBottom: 8 }} />
                <span style={{ fontWeight: 600, color: 'var(--text-mute)' }}>No applications yet</span>
                <span style={{ fontSize: 11, lineHeight: 1.4, marginTop: 4 }}>Drag applications here<br/>when you schedule<br/>an interview.</span>
              </>
            ) : stage.id === 'offer' ? (
              <>
                <Icons.IconBriefcase size={24} style={{ color: 'var(--text-dim)', marginBottom: 8 }} />
                <span style={{ fontWeight: 600, color: 'var(--text-mute)' }}>No offers yet</span>
                <span style={{ fontSize: 11, lineHeight: 1.4, marginTop: 4 }}>Keep going! Your<br/>offer will appear<br/>here.</span>
              </>
            ) : stage.id === 'rejected' ? (
              <>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icons.IconArrowRight size={12} style={{ color: 'var(--text-dim)', transform: 'rotate(45deg)' }} />
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text-mute)' }}>No rejected yet</span>
                <span style={{ fontSize: 11, lineHeight: 1.4, marginTop: 4 }}>Every application<br/>is a step forward.</span>
              </>
            ) : (
              'Drop here'
            )}
          </div>
        ) : (
          apps.map(app => (
            <DraggableCard key={app.id} app={app} onClick={() => onCardClick(app)} />
          ))
        )}
      </div>
      <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--text-mute)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          + Add application
        </button>
      </div>
    </div>
  );
};

const KanbanPipeline = ({ applications, setApplications, updateApplication }) => {
  const [activeApp, setActiveApp] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );

  const handleDragStart = ({ active }) => {
    setActiveApp(applications.find(a => a.id === active.id) || null);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveApp(null);
    if (!over) return;
    const app = applications.find(a => a.id === active.id);
    const newStage = over.id;
    if (!app || app.stage === newStage || !STAGES.find(s => s.id === newStage)) return;

    const snapshot = [...applications];
    setApplications(prev => prev.map(a => a.id === active.id ? { ...a, stage: newStage } : a));

    try {
      await updateApplication(active.id, { stage: newStage });
      toast.success(`Moved to ${newStage}`);
    } catch {
      setApplications(snapshot);
      toast.error('Failed to move card. Please try again.');
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, height: '100%' }}>
          {STAGES.map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              apps={applications.filter(a => a.stage === stage.id)}
              onCardClick={setSelectedApp}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeApp ? (
            <div style={{ width: 272, transform: 'rotate(1.5deg)', opacity: 0.92 }}>
              <CardContent app={activeApp} dim />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {selectedApp && (
          <ApplicationDetailsModal
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onUpdate={updated => {
              setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
              setSelectedApp(null);
            }}
            onDelete={id => {
              setApplications(prev => prev.filter(a => a.id !== id));
              setSelectedApp(null);
            }}
            updateApplication={updateApplication}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default KanbanPipeline;
