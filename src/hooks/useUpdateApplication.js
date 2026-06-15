import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { sendNotification } from '../lib/notificationService';

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

        if (data) {
          try {
            let priority = 'low';
            let title = `Application for ${data.role_title} at ${data.company_name} updated: moved to ${updates.stage}`;
            
            if (updates.stage === 'interview') {
              priority = 'high';
              title = `🎯 Interview invitation scheduled for ${data.role_title} at ${data.company_name}!`;
            } else if (updates.stage === 'offer') {
              priority = 'high';
              title = `🎉 Congratulations! Offer received for ${data.role_title} at ${data.company_name}!`;
            } else if (updates.stage === 'rejected') {
              priority = 'medium';
              title = `Application status update: ${data.role_title} at ${data.company_name}`;
            } else if (updates.stage === 'applied') {
              priority = 'medium';
              title = `Sent application for ${data.role_title} at ${data.company_name}.`;
            }

            await sendNotification(data.user_id, {
              type: 'application',
              title,
              priority,
              action_type: 'open_applications',
              action_target: updates.stage
            });
          } catch (notifErr) {
            console.error("Failed to insert stage update notification:", notifErr);
          }
        }
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
