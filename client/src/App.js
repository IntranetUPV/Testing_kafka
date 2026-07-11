import { useState, useEffect, useRef, useMemo, createElement as h } from 'react';
import { io } from 'socket.io-client';
import Dashboard from './Dashboard.js';

const API_BASE = 'http://localhost:44000';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [event, setEvent] = useState('student_login');
  const [studentId, setStudentId] = useState('202302760');
  const [sentLog, setSentLog] = useState([]);
  const [processedMessages, setProcessedMessages] = useState([]);
  const [status, setStatus] = useState('connecting');
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('disconnected'));

    // Sent once right after connecting, catches the client up on
    // anything that already arrived before this tab was open
    socket.on('initial-messages', (messages) => {
      setProcessedMessages(messages);
    });

    // Pushed instantly the moment Spark's output reaches Kafka,
    // no waiting, no polling interval
    socket.on('processed-message', (entry) => {
      setProcessedMessages((prev) => [entry, ...prev].slice(0, 100));
    });

    return () => socket.disconnect();
  }, []);

  const sendEvent = async () => {
    const sentAt = new Date().toISOString();
    try {
      const res = await fetch(API_BASE + '/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, studentId }),
      });
      const data = await res.json();
      setSentLog((prev) => [{ ...data.payload, sentAt }, ...prev].slice(0, 20));
    } catch (err) {
      setSentLog((prev) => [{ error: 'Failed to send', sentAt }, ...prev].slice(0, 20));
    }
  };

  const isConfirmed = (sent) => {
    return processedMessages.some((m) => {
      try {
        const parsed = JSON.parse(m.value);
        return parsed.studentId === sent.studentId && parsed.timestamp === sent.timestamp;
      } catch {
        return false;
      }
    });
  };

  const parsedEvents = useMemo(() => {
    return processedMessages
      .map((m) => {
        try {
          return JSON.parse(m.value);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }, [processedMessages]);

  const pipelineView = h('div', { key: 'pipeline' }, [
    h('div', { key: 'form', style: styles.formRow }, [
      h(
        'select',
        {
          key: 'select',
          value: event,
          onChange: (e) => setEvent(e.target.value),
          style: styles.input,
        },
        [
          h('option', { key: 'a', value: 'student_login' }, 'student_login'),
          h('option', { key: 'b', value: 'library_checkout' }, 'library_checkout'),
          h('option', { key: 'c', value: 'wifi_connect' }, 'wifi_connect'),
          h('option', { key: 'd', value: 'lms_access' }, 'lms_access'),
        ]
      ),
      h('input', {
        key: 'input',
        value: studentId,
        onChange: (e) => setStudentId(e.target.value),
        style: styles.input,
        placeholder: 'Student ID',
      }),
      h('button', { key: 'btn', onClick: sendEvent, style: styles.button }, 'Send to test-topic'),
    ]),

    h('div', { key: 'columns', style: styles.columns }, [
      h('div', { key: 'sent', style: styles.column }, [
        h('h2', { key: 'title', style: styles.colTitle }, '1. Sent (raw to test-topic)'),
        h(
          'div',
          { key: 'list', style: styles.list },
          sentLog.length === 0
            ? h('p', { key: 'empty', style: styles.empty }, 'Nothing sent yet')
            : sentLog.map((s, i) =>
                h('div', { key: i, style: styles.card }, [
                  h('div', { key: 'header', style: styles.cardHeader }, [
                    h('strong', { key: 'name' }, s.event || 'error'),
                    h(
                      'span',
                      {
                        key: 'badge',
                        style: {
                          ...styles.badge,
                          background: isConfirmed(s) ? '#16a34a' : '#92400e',
                        },
                      },
                      isConfirmed(s) ? 'Confirmed by Spark' : 'Waiting for Spark...'
                    ),
                  ]),
                  h('div', { key: 'body', style: styles.cardBody }, [
                    'studentId: ' + s.studentId,
                    h('br', { key: 'br1' }),
                    'timestamp: ' + s.timestamp,
                    h('br', { key: 'br2' }),
                    'sentAt: ' + s.sentAt,
                  ]),
                ])
              )
        ),
      ]),

      h('div', { key: 'received', style: styles.column }, [
        h('h2', { key: 'title', style: styles.colTitle }, '2. Received (processed-events from Spark)'),
        h(
          'div',
          { key: 'list', style: styles.list },
          processedMessages.length === 0
            ? h(
                'p',
                { key: 'empty', style: styles.empty },
                'No processed messages yet. Make sure Spark is running.'
              )
            : processedMessages.map((m, i) =>
                h('div', { key: i, style: styles.card }, [
                  h('div', { key: 'body', style: styles.cardBody }, [
                    h('pre', { key: 'pre', style: styles.pre }, prettyPrint(m.value)),
                    h(
                      'div',
                      { key: 'meta', style: styles.meta },
                      'partition ' + m.partition + ' - offset ' + m.offset + ' - received ' + m.receivedAt
                    ),
                  ]),
                ])
              )
        ),
      ]),
    ]),
  ]);

  return h('div', { style: styles.page }, [
    h('div', { key: 'header', style: styles.headerRow }, [
      h('h1', { key: 'title', style: styles.title }, 'Intranet portal demo'),
      h('p', { key: 'status', style: styles.statusLine }, [
        'Backend: ',
        h(
          'span',
          { key: 'val', style: { color: status === 'connected' ? '#4ade80' : '#f87171' } },
          status
        ),
      ]),
    ]),

    h('div', { key: 'tabs', style: styles.tabs }, [
      h(
        'button',
        {
          key: 'tab1',
          onClick: () => setTab('dashboard'),
          style: { ...styles.tabButton, ...(tab === 'dashboard' ? styles.tabButtonActive : {}) },
        },
        'Dashboard'
      ),
      h(
        'button',
        {
          key: 'tab2',
          onClick: () => setTab('pipeline'),
          style: { ...styles.tabButton, ...(tab === 'pipeline' ? styles.tabButtonActive : {}) },
        },
        'Pipeline check'
      ),
    ]),

    tab === 'dashboard' ? h(Dashboard, { key: 'dash', events: parsedEvents }) : null,
    tab === 'pipeline' ? pipelineView : null,
  ]);
}

function prettyPrint(jsonStr) {
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch {
    return jsonStr;
  }
}

const styles = {
  page: {
    fontFamily: 'system-ui, sans-serif',
    background: '#0f172a',
    minHeight: '100vh',
    color: '#e2e8f0',
    padding: '24px 32px',
  },
  headerRow: { marginBottom: '14px' },
  title: { fontSize: '22px', marginBottom: '4px' },
  statusLine: { fontSize: '13px', color: '#94a3b8' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #334155' },
  tabButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '10px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
  },
  tabButtonActive: {
    color: '#e2e8f0',
    borderBottom: '2px solid #2563eb',
  },
  formRow: { display: 'flex', gap: '10px', marginBottom: '28px' },
  input: {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#e2e8f0',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
  },
  button: {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  columns: { display: 'flex', gap: '24px' },
  column: { flex: 1, minWidth: 0 },
  colTitle: { fontSize: '15px', marginBottom: '10px', color: '#cbd5e1' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '70vh', overflowY: 'auto' },
  empty: { color: '#64748b', fontSize: '13px' },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    fontSize: '14px',
  },
  cardBody: { fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 },
  badge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '999px',
    color: 'white',
  },
  pre: {
    background: '#0f172a',
    padding: '8px',
    borderRadius: '6px',
    fontSize: '11px',
    overflowX: 'auto',
    margin: 0,
    marginBottom: '6px',
  },
  meta: { fontSize: '11px', color: '#64748b' },
};