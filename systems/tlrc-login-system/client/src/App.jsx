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
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>TLRC Student Login</h1>
      <p>The TLRC needs you to login your Student Number for important purposes.</p>

      <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Student Login</h2>
        <input
          type='text'
          value={id}
          onChange={(e) => setID(e.target.value)}
          placeholder='Enter student ID'
          style={{ width: '100%', padding: 8, marginBottom: 8, boxSizing: 'border-box'}}
        />
        <button onClick={sendEvent} style={{ padding: '10px 16px' }}>
          Enter
        </button>
      </div>

      {status && <div style={{ marginBottom: 16, color: '#333' }}><strong>Status:</strong> {status}</div>}

      <section style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Recent Logins</h2>
        {Array.isArray(logins) && logins.length > 0 ? (
          <div>
            {logins.map((login, index) => {
              const time = login && login.timestamp ? new Date(login.timestamp).toLocaleString() : 'unknown time';
              return (
                <p key={index} style={{ marginBottom: 12 }}>
                  <strong>{login?.studentId || 'Unknown student'}</strong> logged in at {time}
                </p>
              );
            })}
          </div>
        ) : (
          <p>There are no students who have logged on. Login now!</p>
        )}
      </section>
    </div>
  )
}