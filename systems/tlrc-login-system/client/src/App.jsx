import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:44001/api';

export default function App() {
  const [logins, setLogins] = useState([]);
  const [id, setID] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const socket = io('http://localhost:44001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socket.on('initial-messages', (incoming) => setLogins(incoming || []));
    return () => socket.disconnect();
  }, []);

  async function sendEvent() {
    if (!id.trim()) {
      setStatus('Please enter a student ID.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'student_login', studentId: id.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Login failed.');
        return;
      }
      setLogins(data.logins || []);
      setStatus(`Student ID ${id.trim()} has logged in.`);
      setID('');
    } catch (error) {
      console.error('Error sending event', error);
      setStatus('Network error while sending login event.');
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="eyebrow">UP Visayas · Teaching and Learning Resource Center</span>
        <h1>TLRC Student Login</h1>
      </header>

      <p className="helper-text" style={{ marginBottom: 24 }}>
        The TLRC needs you to login your Student Number for important purposes.
      </p>

      <div className="card">
        <h2>Student Login</h2>
        <input
          type="text"
          value={id}
          onChange={(e) => setID(e.target.value)}
          placeholder="Enter student ID"
        />
        <button onClick={sendEvent}>Enter</button>
      </div>

      {status && <div className="status-message">{status}</div>}

      <section className="card">
        <h2>Recent Logins</h2>
        {Array.isArray(logins) && logins.length > 0 ? (
          <ul className="subject-list">
            {logins.map((login, index) => {
              const time = login && login.timestamp
                ? new Date(login.timestamp).toLocaleString()
                : 'unknown time';
              return (
                <li key={index} className="subject-item">
                  <div>
                    <span className="subject-name">{login?.studentId || 'Unknown student'}</span>
                    <span className="subject-meta">logged in at {time}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="helper-text">There are no students who have logged on. Login now!</p>
        )}
      </section>
    </div>
  );
}