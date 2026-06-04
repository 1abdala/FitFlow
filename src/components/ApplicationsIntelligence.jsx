import React from 'react';

const CATEGORY_LABELS = {
  backend: 'Backend', frontend: 'Frontend', devops: 'DevOps',
  data: 'Data', fullstack: 'Fullstack', other: 'Other',
};

const STAGE_COLORS = {
  saved: '#64748b', applied: '#4f7cff', interview: '#8b5cf6',
  offer: '#34d399', rejected: '#f87171',
};

function computeInsights(apps) {
  const total = apps.length;
  const totalApplied = apps.filter(a => a.stage !== 'saved').length;
  const interviewCount = apps.filter(a => a.stage === 'interview' || a.stage === 'offer').length;
  const offerCount = apps.filter(a => a.stage === 'offer').length;
  const interviewRate = totalApplied > 0 ? Math.round((interviewCount / totalApplied) * 100) : 0;
  const avgMatchScore = total > 0
    ? Math.round(apps.reduce((s, a) => s + (a.match_score || 0), 0) / total)
    : 0;

  const catStats = {};
  apps.forEach(app => {
    const cat = app.role_category || 'other';
    if (!catStats[cat]) catStats[cat] = { applied: 0, interviews: 0, totalMatch: 0 };
    catStats[cat].applied++;
    if (app.stage === 'interview' || app.stage === 'offer') catStats[cat].interviews++;
    catStats[cat].totalMatch += (app.match_score || 0);
  });
  Object.values(catStats).forEach(s => {
    s.avgMatch = Math.round(s.totalMatch / s.applied);
    s.interviewRate = Math.round((s.interviews / s.applied) * 100);
  });
  const strongestCat = Object.entries(catStats).sort((a, b) => b[1].interviewRate - a[1].interviewRate)[0] || null;

  const skillGaps = {};
  apps.forEach(app => {
    (app.missing_skills || []).forEach(skill => { skillGaps[skill] = (skillGaps[skill] || 0) + 1; });
  });
  const topGap = Object.entries(skillGaps).sort((a, b) => b[1] - a[1])[0] || null;

  let nextAction;
  if (total === 0) {
    nextAction = { type: 'info', text: 'Add your first application to unlock insights.' };
  } else if (offerCount > 0) {
    nextAction = { type: 'success', text: `You have ${offerCount} offer! Focus on preparation and negotiation.` };
  } else if (totalApplied >= 10 && interviewRate < 20) {
    nextAction = { type: 'warn', text: `Interview rate is only ${interviewRate}%. Try targeting roles with 70%+ match score.` };
  } else if (totalApplied === 0) {
    nextAction = { type: 'tip', text: 'Mark applications as "Applied" after submitting them externally.' };
  } else {
    nextAction = { type: 'ok', text: 'Good progress! Aim for 15+ applications for statistically reliable insights.' };
  }

  return { total, totalApplied, interviewCount, offerCount, interviewRate, avgMatchScore, strongestCat, topGap, nextAction };
}

const KPI = ({ label, value, sub, color = 'var(--text)' }) => (
  <div style={{
    padding: '14px', borderRadius: 12,
    background: 'var(--surface-2)', border: '1px solid var(--border)',
  }}>
    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{sub}</div>}
  </div>
);

const NextAction = ({ action }) => {
  const map = {
    success: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', color: '#34d399' },
    warn:    { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  color: '#fbbf24' },
    tip:     { bg: 'rgba(79,124,255,0.08)',  border: 'rgba(79,124,255,0.2)',  color: '#4f7cff' },
    ok:      { bg: 'rgba(79,124,255,0.08)',  border: 'rgba(79,124,255,0.2)',  color: '#4f7cff' },
    info:    { bg: 'var(--surface-2)',        border: 'var(--border)',          color: 'var(--text-mute)' },
  };
  const c = map[action.type] || map.info;
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: c.bg, border: `1px solid ${c.border}` }}>
      <div style={{ fontSize: 10, color: c.color, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>Next action</div>
      <p style={{ fontSize: 12, color: 'var(--text-mute)', lineHeight: 1.6, margin: 0 }}>{action.text}</p>
    </div>
  );
};

const ApplicationsIntelligence = ({ applications }) => {
  const { total, totalApplied, interviewCount, offerCount, interviewRate, avgMatchScore, strongestCat, topGap, nextAction } = computeInsights(applications);

  const stageCounts = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
  applications.forEach(a => { if (stageCounts[a.stage] !== undefined) stageCounts[a.stage]++; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'var(--accent-soft)', color: 'var(--accent)',
          display: 'grid', placeItems: 'center', fontSize: 15, flexShrink: 0,
        }}>⚡</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Intelligence</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Calculated from your data</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <KPI label="Total" value={total} sub={`${totalApplied} submitted`} />
        <KPI
          label="Interview Rate"
          value={`${interviewRate}%`}
          sub={`${interviewCount} interviews`}
          color={interviewRate >= 30 ? '#34d399' : interviewRate >= 15 ? '#fbbf24' : interviewRate > 0 ? '#f87171' : 'var(--text-dim)'}
        />
        <KPI
          label="Avg Match"
          value={avgMatchScore > 0 ? `${avgMatchScore}%` : '—'}
          sub="at apply time"
          color={avgMatchScore >= 70 ? '#34d399' : avgMatchScore >= 50 ? '#fbbf24' : 'var(--text-mute)'}
        />
        <KPI
          label="Offers"
          value={offerCount}
          sub={offerCount > 0 ? '🎉 Congrats!' : 'Keep going'}
          color={offerCount > 0 ? '#34d399' : 'var(--text-mute)'}
        />
      </div>

      {/* Pipeline bar */}
      <div style={{ padding: '14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 12 }}>Pipeline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(stageCounts).map(([stage, count]) => {
            const widthPct = total > 0 ? Math.max((count / total) * 100, 2) : 0;
            return (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, fontSize: 11, color: count > 0 ? 'var(--text)' : 'var(--text-dim)', textTransform: 'capitalize' }}>{stage}</div>
                <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                  {count > 0 && (
                    <div style={{ width: `${widthPct}%`, height: '100%', background: STAGE_COLORS[stage], borderRadius: 999 }} />
                  )}
                </div>
                <div style={{ width: 16, fontSize: 11, color: 'var(--text-mute)', textAlign: 'right', fontWeight: 700 }}>{count > 0 ? count : ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strongest category */}
      {strongestCat && strongestCat[1].applied > 0 && (
        <div style={{ padding: '14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>Strongest category</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{CATEGORY_LABELS[strongestCat[0]] || strongestCat[0]}</div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>
            {strongestCat[1].interviewRate}% interview rate · {strongestCat[1].avgMatch}% avg match
          </div>
        </div>
      )}

      {/* Top skill gap */}
      {topGap && (
        <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.14)' }}>
          <div style={{ fontSize: 10, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>Top missing skill</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}>{topGap[0]}</div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>
            Missing from {topGap[1]} application{topGap[1] !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <NextAction action={nextAction} />
    </div>
  );
};

export default ApplicationsIntelligence;
