import { useState } from 'react';
import { supabase } from '../lib/supabase';

const STAGE_TIMESTAMPS = {
  saved:     {},
  applied:   { applied_at: true },
  interview: { interview_scheduled_at: true },
  offer:     { offer_received_at: true },
  rejected:  {},
};

export function useUpdateApplication() {
  const [loading, setLoading] = useState(false);

  const updateApplication = async (id, updates) => {
    setLoading(true);
    try {
      const timestamps = {};
      if (updates.stage) {
        Object.keys(STAGE_TIMESTAMPS[updates.stage] || {}).forEach(key => {
          timestamps[key] = new Date().toISOString();
        });
      }

      const { data, error } = await supabase
        .from('tracker_applications')
        .update({ ...updates, ...timestamps, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (updates.stage) {
        await supabase.from('tracker_application_events').insert({
          application_id: id,
          event_type: 'status_changed',
          event_title: `Moved to ${updates.stage}`,
          event_date: new Date().toISOString(),
        });
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  const createApplication = async (fields) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tracker_applications')
        .insert({ ...fields, user_id: user.id, saved_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const deleteApplication = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tracker_applications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  return { updateApplication, createApplication, deleteApplication, loading };
}
