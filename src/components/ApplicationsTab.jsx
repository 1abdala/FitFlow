import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import * as Icons from './Icons';
import { useApplications } from '../hooks/useApplications';
import { useUpdateApplication } from '../hooks/useUpdateApplication';
import KanbanPipeline from './KanbanPipeline';
import MobileApplicationsList from './MobileApplicationsList';
import ApplicationsIntelligence from './ApplicationsIntelligence';
import AddApplicationModal from './AddApplicationModal';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

const Skeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {[1, 2, 3].map(i => (
      <div key={i} className="animate-pulse" style={{
        height: 72, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)',
      }} />
    ))}
  </div>
);

const ApplicationsTab = () => {
  const isDesktop = useMediaQuery('(min-width: 1200px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1400px)');
  const [showAddModal, setShowAddModal] = useState(false);

  const { applications, loading, error, setApplications } = useApplications();
  const { updateApplication, createApplication } = useUpdateApplication();

  const handleUpdate = useCallback((id, updates) => updateApplication(id, updates), [updateApplication]);

  const handleAdded = useCallback((newApp) => {
    setApplications(prev => [newApp, ...prev]);
  }, [setApplications]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Tab toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        marginBottom: 16, gap: 16,
      }}>
        {isDesktop && (
          <button className="btn btn-ghost" style={{ pointerEvents: 'none', fontSize: 14, fontWeight: 600 }}>
            Kanban View
          </button>
        )}
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ fontSize: 14, fontWeight: 600 }}>
          <Icons.IconPlus size={16} style={{ marginRight: 6 }} /> Add Application
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 16,
          background: 'var(--danger-soft)', color: 'var(--danger)',
          border: '1px solid rgba(248,113,113,0.2)', fontSize: 13,
        }}>
          Failed to load applications: {error}
        </div>
      )}

      {/* Main layout */}
      {isDesktop ? (
        /* Desktop: Kanban + Intelligence side-by-side */
        <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, minWidth: 0, overflowX: 'auto', paddingBottom: 16 }}>
            {loading ? (
              <div style={{ display: 'flex', gap: 16 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse" style={{
                    flex: 1, minWidth: 200, height: 320, borderRadius: 14,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                  }} />
                ))}
              </div>
            ) : (
              <KanbanPipeline
                applications={applications}
                setApplications={setApplications}
                updateApplication={handleUpdate}
              />
            )}
          </div>
          <div style={{ width: isLargeDesktop ? 320 : 280, flexShrink: 0, position: 'sticky', top: 24 }}>
            <div style={{
              padding: 20, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16,
            }}>
              <ApplicationsIntelligence applications={applications} />
            </div>
          </div>
        </div>
      ) : (
        /* Mobile: Intelligence + List stacked */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
          }}>
            <ApplicationsIntelligence applications={applications} />
          </div>
          {loading ? <Skeleton /> : (
            <MobileApplicationsList
              applications={applications}
              setApplications={setApplications}
              updateApplication={handleUpdate}
            />
          )}
        </div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddApplicationModal
            onClose={() => setShowAddModal(false)}
            onAdded={handleAdded}
            createApplication={createApplication}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApplicationsTab;
