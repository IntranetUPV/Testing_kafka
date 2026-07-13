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
    h('div', { key: 'form', className: 'form-row' }, [
      h(
        'select',
        {
          key: 'select',
          value: event,
          onChange: (e) => setEvent(e.target.value),
          className: 'field',
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
        className: 'field',
        placeholder: 'Student ID',
      }),
      h('button', { key: 'btn', onClick: sendEvent, className: 'btn' }, 'Send to test-topic'),
    ]),

    h('div', { key: 'columns', className: 'columns' }, [
      h('div', { key: 'sent', className: 'column' }, [
        h('h2', { key: 'title', className: 'col-title' }, '1. Sent (raw to test-topic)'),
        h(
          'div',
          { key: 'list', className: 'list' },
          sentLog.length === 0
            ? h('p', { key: 'empty', className: 'empty' }, 'Nothing sent yet')
            : sentLog.map((s, i) =>
                h('div', { key: i, className: 'event-card' }, [
                  h('div', { key: 'header', className: 'event-header' }, [
                    h('strong', { key: 'name' }, s.event || 'error'),
                    h(
                      'span',
                      {
                        key: 'badge',
                        className: 'badge ' + (isConfirmed(s) ? 'confirmed' : 'waiting'),
                      },
                      isConfirmed(s) ? 'Confirmed by Spark' : 'Waiting for Spark...'
                    ),
                  ]),
                  h('div', { key: 'body', className: 'event-body' }, [
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

      h('div', { key: 'received', className: 'column' }, [
        h('h2', { key: 'title', className: 'col-title' }, '2. Received (processed-events from Spark)'),
        h(
          'div',
          { key: 'list', className: 'list' },
          processedMessages.length === 0
            ? h(
                'p',
                { key: 'empty', className: 'empty' },
                'No processed messages yet. Make sure Spark is running.'
              )
            : processedMessages.map((m, i) => {
                const parsed = (() => {
                  try {
                    return JSON.parse(m.value);
                  } catch {
                    return null;
                  }
                })();

                return h('div', { key: i, className: 'event-card' }, [
                  parsed && parsed.system
                    ? h('div', { key: 'source', className: 'source-tag' }, parsed.system.toUpperCase())
                    : null,
                  h('div', { key: 'body', className: 'event-body' }, [
                    h('pre', { key: 'pre', className: 'code-block' }, prettyPrint(m.value)),
                    h(
                      'div',
                      { key: 'meta', className: 'event-meta' },
                      'partition ' + m.partition + ' - offset ' + m.offset + ' - received ' + m.receivedAt
                    ),
                  ]),
                ]);
              })
        ),
      ]),
    ]),
  ]);

  return h('div', { className: 'container' }, [
    h('div', { key: 'header' }, [
      h('header', { key: 'headerinner' }, [
        h('h1', { key: 'title' }, 'Intranet portal demo'),
      ]),
      h('p', { key: 'status', className: 'subtitle' }, [
        'Backend: ',
        h(
          'span',
          { key: 'val', className: status === 'connected' ? 'status success' : 'status error', style: { display: 'inline' } },
          status
        ),
      ]),
    ]),

    h('div', { key: 'tabs', className: 'tabs' }, [
      h(
        'button',
        {
          key: 'tab1',
          onClick: () => setTab('dashboard'),
          className: 'tab-button' + (tab === 'dashboard' ? ' tab-button-active' : ''),
        },
        'Dashboard'
      ),
      h(
        'button',
        {
          key: 'tab2',
          onClick: () => setTab('pipeline'),
          className: 'tab-button' + (tab === 'pipeline' ? ' tab-button-active' : ''),
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