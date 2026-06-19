import { useEffect, useState, useCallback } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4000';
const EVENT_OPTIONS = ['student_login', 'student_logout', 'grade_viewed', 'enrollment_updated'];
const POLL_INTERVAL_MS = 2000;

function App() {
  const [event, setEvent] = useState(EVENT_OPTIONS[0]);
  const [studentId, setStudentId] = useState('202302760');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.messages);
      setError(null);
    } catch (err) {
      setError('Could not reach API server. Is it running on port 4000?');
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchMessages]);

  async function handleSend(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setStatus({ type: 'success', text: 'Event sent to Kafka' });
      fetchMessages();
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Intranet Portal Kafka Demo</h1>
        <p className="subtitle">Producer / consumer dashboard for the SIS / LMS event stream</p>
      </header>

      {error && <div className="banner error">{error}</div>}

      <section className="card">
        <h2>Send an event</h2>
        <form onSubmit={handleSend} className="form">
          <label>
            Event type
            <select value={event} onChange={(e) => setEvent(e.target.value)}>
              {EVENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label>
            Student ID
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 202302760"
              required
            />
          </label>

          <button type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send to Kafka'}
          </button>
        </form>

        {status && (
          <p className={status.type === 'success' ? 'status success' : 'status error'}>
            {status.text}
          </p>
        )}
      </section>

      <section className="card">
        <div className="messages-header">
          <h2>Consumed messages</h2>
          <span className="badge">{messages.length}</span>
        </div>

        {messages.length === 0 ? (
          <p className="empty">No messages yet. Send one above.</p>
        ) : (
          <ul className="message-list">
            {messages.map((m, idx) => {
              const parsed = safeParse(m.value);
              return (
                <li key={`${m.offset}-${idx}`} className="message-item">
                  <div className="message-meta">
                    <span>topic: {m.topic}</span>
                    <span>partition: {m.partition}</span>
                    <span>offset: {m.offset}</span>
                  </div>
                  <pre className="message-value">
                    {parsed ? JSON.stringify(parsed, null, 2) : m.value}
                  </pre>
                  <div className="message-time">{new Date(m.receivedAt).toLocaleTimeString()}</div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default App;