import { useEffect, useRef, useMemo, createElement as h } from 'react';

const MAROON = '#7b1113';
const GREEN = '#014421';
const GOLD = '#ffc72c';
const MUTED = '#6b6560';
const HAIRLINE = '#ddd5c7';

// Cycled across systems in the doughnut chart / legend
const SYSTEM_PALETTE = ['#7b1113', '#014421', '#ffc72c', '#94571f', '#3a6b8a', '#6b6560'];

export default function Dashboard({ events }) {
  const lineCanvasRef = useRef(null);
  const lineChartRef = useRef(null);
  const barCanvasRef = useRef(null);
  const barChartRef = useRef(null);
  const systemCanvasRef = useRef(null);
  const systemChartRef = useRef(null);

  const stats = useMemo(() => {
    const byType = {};
    const byStudent = {};
    const byMinute = {};
    const bySystem = {};

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

      const system = e.system || 'unknown';
      bySystem[system] = (bySystem[system] || 0) + 1;
    });

    const topStudents = Object.entries(byStudent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const timeline = Object.entries(byMinute).sort((a, b) => a[0].localeCompare(b[0]));

    const systems = Object.entries(bySystem).sort((a, b) => b[1] - a[1]);

    return { byType, topStudents, timeline, systems, total: events.length };
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
            borderColor: MAROON,
            backgroundColor: 'rgba(123, 17, 19, 0.12)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: MAROON,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: MUTED, precision: 0 }, grid: { color: HAIRLINE } },
          x: { ticks: { color: MUTED }, grid: { color: HAIRLINE } },
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
            backgroundColor: GREEN,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: MUTED, precision: 0 }, grid: { color: HAIRLINE } },
          x: { ticks: { color: MUTED }, grid: { display: false } },
        },
      },
    });
  }, [stats.byType]);

  useEffect(() => {
    if (!window.Chart || !systemCanvasRef.current) return;
    if (systemChartRef.current) systemChartRef.current.destroy();

    systemChartRef.current = new window.Chart(systemCanvasRef.current, {
      type: 'doughnut',
      data: {
        labels: stats.systems.map((entry) => entry[0]),
        datasets: [
          {
            data: stats.systems.map((entry) => entry[1]),
            backgroundColor: stats.systems.map((_, i) => SYSTEM_PALETTE[i % SYSTEM_PALETTE.length]),
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { legend: { display: false } },
      },
    });
  }, [stats.systems]);

  const maxStudentCount = stats.topStudents.length > 0 ? stats.topStudents[0][1] : 1;

  return h('div', null, [
    h('div', { key: 'metrics', className: 'metric-grid' }, [
      h('div', { key: 'm1', className: 'metric-card' }, [
        h('p', { key: 'l', className: 'metric-label' }, 'Total events'),
        h('p', { key: 'v', className: 'metric-value' }, stats.total),
      ]),
      h('div', { key: 'm2', className: 'metric-card' }, [
        h('p', { key: 'l', className: 'metric-label' }, 'Event types'),
        h('p', { key: 'v', className: 'metric-value' }, Object.keys(stats.byType).length),
      ]),
      h('div', { key: 'm3', className: 'metric-card' }, [
        h('p', { key: 'l', className: 'metric-label' }, 'Unique students'),
        h('p', { key: 'v', className: 'metric-value' }, stats.topStudents.length),
      ]),
      h('div', { key: 'm4', className: 'metric-card' }, [
        h('p', { key: 'l', className: 'metric-label' }, 'Systems'),
        h('p', { key: 'v', className: 'metric-value' }, stats.systems.length),
      ]),
    ]),

    h('div', { key: 'toprow', className: 'two-col' }, [
      h('div', { key: 'timeline-section', className: 'section' }, [
        h('h2', { key: 'title', className: 'section-title' }, 'Events over time'),
        h('div', { key: 'chartwrap', style: { position: 'relative', height: '240px' } }, [
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

      h('div', { key: 'system-section', className: 'section' }, [
        h('h2', { key: 'title', className: 'section-title' }, 'Events by system'),
        stats.systems.length === 0
          ? h('p', { key: 'empty', className: 'empty' }, 'No system data yet')
          : h('div', { key: 'row', className: 'system-row' }, [
              h('div', { key: 'chartwrap', className: 'system-chart-wrap' }, [
                h(
                  'canvas',
                  {
                    key: 'canvas',
                    ref: systemCanvasRef,
                    role: 'img',
                    'aria-label': 'Doughnut chart of event counts grouped by originating system',
                  },
                  'Event counts by system'
                ),
              ]),
              h(
                'div',
                { key: 'legend', className: 'system-legend' },
                stats.systems.map((entry, i) =>
                  h('div', { key: entry[0], className: 'system-legend-item' }, [
                    h('span', {
                      key: 'dot',
                      className: 'system-dot',
                      style: { background: SYSTEM_PALETTE[i % SYSTEM_PALETTE.length] },
                    }),
                    h('span', { key: 'name', className: 'system-name' }, entry[0]),
                    h('span', { key: 'count', className: 'student-count' }, entry[1]),
                  ])
                )
              ),
            ]),
      ]),
    ]),

    h('div', { key: 'twocol', className: 'two-col' }, [
      h('div', { key: 'bytype', className: 'section' }, [
        h('h2', { key: 'title', className: 'section-title' }, 'Events by type'),
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

      h('div', { key: 'topstudents', className: 'section' }, [
        h('h2', { key: 'title', className: 'section-title' }, 'Most active students'),
        stats.topStudents.length === 0
          ? h('p', { key: 'empty', className: 'empty' }, 'No student data yet')
          : null,
        h(
          'div',
          { key: 'list', style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
          stats.topStudents.map((entry) => {
            const id = entry[0];
            const count = entry[1];
            return h('div', { key: id }, [
              h('div', { key: 'row', className: 'student-row' }, [
                h('span', { key: 'id' }, id),
                h('span', { key: 'count', className: 'student-count' }, count),
              ]),
              h('div', { key: 'track', className: 'bar-track' }, [
                h('div', {
                  key: 'fill',
                  className: 'bar-fill',
                  style: { width: (count / maxStudentCount) * 100 + '%' },
                }),
              ]),
            ]);
          })
        ),
      ]),
    ]),
  ]);
}