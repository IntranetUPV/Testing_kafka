import { useEffect, useRef, useMemo, createElement as h } from 'react';

export default function Dashboard({ events }) {
  const lineCanvasRef = useRef(null);
  const lineChartRef = useRef(null);
  const barCanvasRef = useRef(null);
  const barChartRef = useRef(null);

  const stats = useMemo(() => {
    const byType = {};
    const byStudent = {};
    const byMinute = {};

    events.forEach((e) => {
      const type = e.event || e.source || 'unknown';
      byType[type] = (byType[type] || 0) + 1;

      if (e.studentId) {
        byStudent[e.studentId] = (byStudent[e.studentId] || 0) + 1;
      }

      if (e.timestamp) {
        const d = new Date(e.timestamp);
        const key = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        byMinute[key] = (byMinute[key] || 0) + 1;
      }
    });

    const topStudents = Object.entries(byStudent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const timeline = Object.entries(byMinute).sort((a, b) => a[0].localeCompare(b[0]));

    return { byType, topStudents, timeline, total: events.length };
  }, [events]);

  useEffect(() => {
    if (!window.Chart || !lineCanvasRef.current) return;
    if (lineChartRef.current) lineChartRef.current.destroy();

    lineChartRef.current = new window.Chart(lineCanvasRef.current, {
      type: 'line',
      data: {
        labels: stats.timeline.map((entry) => entry[0]),
        datasets: [
          {
            label: 'Events per minute',
            data: stats.timeline.map((entry) => entry[1]),
            borderColor: '#378ADD',
            backgroundColor: 'rgba(55, 138, 221, 0.15)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#94a3b8', precision: 0 }, grid: { color: '#1e293b' } },
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
        },
      },
    });
  }, [stats.timeline]);

  useEffect(() => {
    if (!window.Chart || !barCanvasRef.current) return;
    if (barChartRef.current) barChartRef.current.destroy();

    const entries = Object.entries(stats.byType);

    barChartRef.current = new window.Chart(barCanvasRef.current, {
      type: 'bar',
      data: {
        labels: entries.map((entry) => entry[0]),
        datasets: [
          {
            label: 'Count',
            data: entries.map((entry) => entry[1]),
            backgroundColor: '#1D9E75',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#94a3b8', precision: 0 }, grid: { color: '#1e293b' } },
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
        },
      },
    });
  }, [stats.byType]);

  const maxStudentCount = stats.topStudents.length > 0 ? stats.topStudents[0][1] : 1;

  return h('div', null, [
    h('div', { key: 'metrics', style: styles.metricGrid }, [
      h('div', { key: 'm1', style: styles.metricCard }, [
        h('p', { key: 'l', style: styles.metricLabel }, 'Total events'),
        h('p', { key: 'v', style: styles.metricValue }, stats.total),
      ]),
      h('div', { key: 'm2', style: styles.metricCard }, [
        h('p', { key: 'l', style: styles.metricLabel }, 'Event types'),
        h('p', { key: 'v', style: styles.metricValue }, Object.keys(stats.byType).length),
      ]),
      h('div', { key: 'm3', style: styles.metricCard }, [
        h('p', { key: 'l', style: styles.metricLabel }, 'Unique students'),
        h('p', { key: 'v', style: styles.metricValue }, stats.topStudents.length),
      ]),
    ]),

    h('div', { key: 'timeline-section', style: styles.section }, [
      h('h2', { key: 'title', style: styles.sectionTitle }, 'Events over time'),
      h('div', { key: 'chartwrap', style: { position: 'relative', height: '220px' } }, [
        h(
          'canvas',
          {
            key: 'canvas',
            ref: lineCanvasRef,
            role: 'img',
            'aria-label': 'Line chart of events received per minute',
          },
          'Events per minute timeline'
        ),
      ]),
    ]),

    h('div', { key: 'twocol', style: styles.twoCol }, [
      h('div', { key: 'bytype', style: styles.section }, [
        h('h2', { key: 'title', style: styles.sectionTitle }, 'Events by type'),
        h('div', { key: 'chartwrap', style: { position: 'relative', height: '240px' } }, [
          h(
            'canvas',
            {
              key: 'canvas',
              ref: barCanvasRef,
              role: 'img',
              'aria-label': 'Bar chart of event counts grouped by event type',
            },
            'Event counts by type'
          ),
        ]),
      ]),

      h('div', { key: 'topstudents', style: styles.section }, [
        h('h2', { key: 'title', style: styles.sectionTitle }, 'Most active students'),
        stats.topStudents.length === 0
          ? h('p', { key: 'empty', style: styles.empty }, 'No student data yet')
          : null,
        h(
          'div',
          { key: 'list', style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
          stats.topStudents.map((entry) => {
            const id = entry[0];
            const count = entry[1];
            return h('div', { key: id }, [
              h('div', { key: 'row', style: styles.studentRow }, [
                h('span', { key: 'id' }, id),
                h('span', { key: 'count', style: { color: '#94a3b8' } }, count),
              ]),
              h('div', { key: 'track', style: styles.barTrack }, [
                h('div', {
                  key: 'fill',
                  style: { ...styles.barFill, width: (count / maxStudentCount) * 100 + '%' },
                }),
              ]),
            ]);
          })
        ),
      ]),
    ]),
  ]);
}

const styles = {
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  metricCard: {
    background: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
  },
  metricLabel: { fontSize: '12px', color: '#94a3b8', margin: 0, marginBottom: '6px' },
  metricValue: { fontSize: '24px', fontWeight: 500, margin: 0 },
  section: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  sectionTitle: { fontSize: '14px', color: '#cbd5e1', marginTop: 0, marginBottom: '12px' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  empty: { color: '#64748b', fontSize: '13px' },
  studentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '4px',
  },
  barTrack: {
    height: '6px',
    background: '#0f172a',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    background: '#378ADD',
    borderRadius: '999px',
  },
};