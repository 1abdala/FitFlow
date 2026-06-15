import { supabase } from './supabase';

const COOLDOWN_HOURS = {
  system: 1,      // 1 hour for general system logs
  cv: 1,          // 1 hour for CV analysis
  match: 24,      // 24 hours for matches
  internship: 24, // 24 hours for new listings
  application: 0, // No cooldown for status updates (direct state changes)
};

const PREFERENCE_MAP = {
  match: 'match_updates',
  internship: 'new_internships',
  application: 'application_status',
};

/**
 * Standardized notification sender utility.
 * Automatically validates notification preferences and suppresses duplicates.
 */
export async function sendNotification(studentId, { type, title, priority = 'low', action_type = null, action_target = null }) {
  if (!studentId) return { error: new Error('Student ID is required') };

  const validTypes = ['system', 'match', 'application', 'internship', 'cv'];
  if (!validTypes.includes(type)) {
    return { error: new Error(`Invalid notification type: ${type}. Must be one of ${validTypes.join(', ')}`) };
  }

  try {
    // 1. Fetch user's notification preferences
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', studentId)
      .single();

    if (profErr) throw profErr;

    // 2. Validate preferences
    const prefKey = PREFERENCE_MAP[type];
    if (prefKey && profile?.notification_preferences) {
      const isEnabled = profile.notification_preferences[prefKey];
      if (isEnabled === false) {
        console.log(`Notification of type '${type}' suppressed by user preferences.`);
        return { success: false, reason: 'suppressed_by_preferences' };
      }
    }

    // 3. Duplicate Prevention Checks
    const cooldown = COOLDOWN_HOURS[type] || 0;
    if (cooldown > 0 && action_target) {
      const { data: recent, error: recentErr } = await supabase
        .from('notifications')
        .select('sent_at')
        .eq('student_id', studentId)
        .eq('type', type)
        .eq('action_target', action_target)
        .order('sent_at', { ascending: false })
        .limit(1);

      if (!recentErr && recent && recent.length > 0) {
        const lastSent = new Date(recent[0].sent_at);
        const diffMs = new Date() - lastSent;
        const cooldownMs = cooldown * 60 * 60 * 1000;
        
        if (diffMs < cooldownMs) {
          console.log(`Notification of type '${type}' on target '${action_target}' suppressed due to cooldown.`);
          return { success: false, reason: 'suppressed_by_cooldown' };
        }
      }
    }

    // 4. Insert notification
    const { data, error: insertErr } = await supabase
      .from('notifications')
      .insert({
        student_id: studentId,
        type,
        title,
        priority,
        action_type,
        action_target,
        is_read: false
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return { success: true, data };
  } catch (err) {
    console.error("Error in sendNotification:", err);
    return { error: err };
  }
}

/**
 * Checks for new high matches and match score improvements, then inserts notifications.
 * Respects student's notification preferences and prevents duplicate spam.
 */
export async function checkAndNotifyMatchChanges(studentId) {
  if (!studentId) return { error: new Error('Student ID is required') };

  try {
    // 1. Fetch user's notification preferences
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', studentId)
      .single();

    if (profErr) throw profErr;

    // Check if match updates or new internships are enabled
    const matchEnabled = profile?.notification_preferences?.match_updates !== false;
    const newInternshipsEnabled = profile?.notification_preferences?.new_internships !== false;

    if (!matchEnabled && !newInternshipsEnabled) {
      return { success: true, reason: 'all_match_notifications_disabled' };
    }

    // 2. Query the current matches
    const { data: newMatches, error: matchesErr } = await supabase
      .from('matching_results')
      .select(`
        id,
        match_score,
        internship_id,
        internships ( title, company_name )
      `)
      .eq('student_id', studentId);

    if (matchesErr) throw matchesErr;
    if (!newMatches || newMatches.length === 0) return { success: true };

    // 3. Fetch recent notifications of type 'match' and 'internship' to compare
    const { data: recentNotifs, error: notifErr } = await supabase
      .from('notifications')
      .select('type, action_target, title')
      .eq('student_id', studentId)
      .in('type', ['match', 'internship']);

    if (notifErr) throw notifErr;

    const notifiedMatchInternships = {};
    const notifiedNewInternships = {};
    const notifiedScores = {}; // Map of internshipId -> highest notified score
    
    recentNotifs?.forEach(n => {
      const internshipId = n.action_target;
      if (!internshipId) return;
      
      if (n.type === 'internship') {
        notifiedNewInternships[internshipId] = true;
      }
      if (n.type === 'match') {
        notifiedMatchInternships[internshipId] = true;
        
        // Try to parse the score if it contains a percentage
        const matchPct = n.title.match(/(\d+)%\s*Match/i) || n.title.match(/->\s*(\d+)%/);
        if (matchPct) {
          const score = parseInt(matchPct[1]);
          if (!notifiedScores[internshipId] || score > notifiedScores[internshipId]) {
            notifiedScores[internshipId] = score;
          }
        }
      }
    });

    // 4. Iterate over new matches and check if we should notify
    for (const match of newMatches) {
      const internshipId = match.internship_id;
      const newScore = Math.round(Number(match.match_score));
      const internship = match.internships;
      if (!internship) continue;

      const title = internship.title;
      const company = internship.company_name;

      // Scenario A: Newly Scraped Match (High Score) -> type: 'internship'
      if (newScore >= 80 && !notifiedNewInternships[internshipId] && newInternshipsEnabled) {
        await supabase.from('notifications').insert({
          student_id: studentId,
          type: 'internship',
          title: `New internship opportunity matches your skills: ${title} at ${company} (${newScore}% Match)`,
          priority: 'medium',
          action_type: 'open_internship',
          action_target: internshipId
        });
        notifiedNewInternships[internshipId] = true; 
      }

      // Scenario B: Match Score Improved -> type: 'match'
      const prevNotifiedScore = notifiedScores[internshipId];
      if (prevNotifiedScore !== undefined && newScore > prevNotifiedScore && matchEnabled) {
        await supabase.from('notifications').insert({
          student_id: studentId,
          type: 'match',
          title: `Match score for ${title} at ${company} increased from ${prevNotifiedScore}% -> ${newScore}%!`,
          priority: 'high',
          action_type: 'open_internship',
          action_target: internshipId
        });
        notifiedScores[internshipId] = newScore; 
      }
      
      // Scenario C: High Match -> type: 'match'
      else if (newScore >= 80 && !notifiedMatchInternships[internshipId] && matchEnabled) {
        await supabase.from('notifications').insert({
          student_id: studentId,
          type: 'match',
          title: `🎯 High Match Found! You are a ${newScore}% match for ${title} at ${company}.`,
          priority: newScore >= 90 ? 'high' : 'medium',
          action_type: 'open_internship',
          action_target: internshipId
        });
        notifiedMatchInternships[internshipId] = true; 
        notifiedScores[internshipId] = newScore;
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error in checkAndNotifyMatchChanges:", err);
    return { error: err };
  }
}

