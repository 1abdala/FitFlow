import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  const fetchApplications = useCallback(async (uid) => {
    try {
      const { data, error: err } = await supabase
        .from('tracker_applications')
        .select('*')
        .eq('user_id', uid)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setApplications(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let channel;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      await fetchApplications(user.id);

      channel = supabase
        .channel('tracker_apps_' + user.id)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tracker_applications',
          filter: `user_id=eq.${user.id}`,
        }, ({ eventType, new: next, old }) => {
          if (eventType === 'INSERT' && !next.deleted_at) {
            setApplications(prev => [next, ...prev]);
          } else if (eventType === 'UPDATE') {
            if (next.deleted_at) {
              setApplications(prev => prev.filter(a => a.id !== next.id));
            } else {
              setApplications(prev => prev.map(a => a.id === next.id ? next : a));
            }
          } else if (eventType === 'DELETE') {
            setApplications(prev => prev.filter(a => a.id !== old.id));
          }
        })
        .subscribe();
    };

    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [fetchApplications]);

  const refetch = useCallback(() => {
    if (userId) fetchApplications(userId);
  }, [userId, fetchApplications]);

  return { applications, loading, error, setApplications, refetch };
}
