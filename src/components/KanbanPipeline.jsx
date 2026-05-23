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

    {app.missing_skills?.length > 0 && (
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {app.missing_skills.slice(0, 2).map(s => (
          <span key={s} className="skill-chip skill-miss" style={{ fontSize: 9, padding: '2px 5px' }}>{s}</span>
        ))}
        {app.missing_skills.length > 2 && (
          <span className="skill-chip" style={{ fontSize: 9, padding: '2px 5px' }}>+{app.missing_skills.length - 2}</span>
        )}
      </div>
    )}

    {(app.applied_at || app.saved_at) && (
      <div style={{ fontSize: 9, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 3 }}>
        <Icons.IconClock size={9} />
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
        opacity: isDragging ? 0.25 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        transition: isDragging ? undefined : 'opacity 0.15s',
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
      width: 272, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: isOver ? 'rgba(79,124,255,0.04)' : 'var(--surface)',
      border: `1px solid ${isOver ? 'rgba(79,124,255,0.35)' : 'var(--border)'}`,
      borderRadius: 14, overflow: 'hidden',
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      {/* Column header */}
      <div style={{
        padding: '13px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)',
      }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{stage.label}</span>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 999,
          background: apps.length > 0 ? stage.color + '18' : 'var(--surface-2)',
          color: apps.length > 0 ? stage.color : 'var(--text-dim)',
          fontWeight: 700, minWidth: 20, textAlign: 'center',
        }}>{apps.length}</span>
      </div>

      {/* Drop zone + cards */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 7,
          overflowY: 'auto', minHeight: 120,
        }}
      >
        {apps.length === 0 ? (
          <div style={{
            flex: 1, display: 'grid', placeItems: 'center',
            fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', padding: '24px 8px',
            border: `1px dashed ${isOver ? stage.color + '60' : 'var(--border)'}`,
            borderRadius: 10, transition: 'border-color 0.15s',
          }}>
            Drop here
          </div>
        ) : (
          apps.map(app => (
            <DraggableCard key={app.id} app={app} onClick={() => onCardClick(app)} />
          ))
        )}
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minHeight: 480 }}>
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
