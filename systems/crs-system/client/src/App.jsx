import { useState } from 'react';

const API_BASE = 'http://localhost:44002/api';

export default function App() {
  const [studentId, setStudentId] = useState('');
  const [loggedInId, setLoggedInId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectName, setSubjectName] = useState('');
  const [subjectUnit, setSubjectUnit] = useState('');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('');

  async function login() {
    const trimmedId = studentId.trim();
    if (!trimmedId) {
      setStatus('Please enter a student ID.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'student_login', studentId: trimmedId })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Login failed.');
        return;
      }
      setLoggedInId(trimmedId);
      setSubjects(data.subjects || []);
      setStatus(`Logged in as ${trimmedId}`);
    } catch (error) {
      console.error('Error logging in:', error);
      setStatus('Network error while logging in.');
    }
  }

  async function addSubject() {
    if (!loggedInId) {
      setStatus('Please log in first.');
      return;
    }
    if (!subjectName.trim() || !subjectUnit.trim() || !courseId.trim()) {
      setStatus('Please enter subject name, unit, and course ID.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/students/${loggedInId}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subjectName.trim(),
          unit: subjectUnit.trim(),
          courseId: courseId.trim(),
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Unable to add subject.');
        return;
      }
      setSubjects(data.subjects || []);
      setSubjectName('');
      setSubjectUnit('');
      setCourseId('');
      setStatus('Subject added successfully.');
    } catch (error) {
      console.error('Error adding subject:', error);
      setStatus('Network error while adding subject.');
    }
  }

  async function removeSubject(subjectId) {
    if (!loggedInId) {
      setStatus('Please log in first.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/students/${loggedInId}/subjects/${subjectId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Unable to remove subject.');
        return;
      }
      setSubjects(data.subjects || []);
      setStatus('Subject removed.');
    } catch (error) {
      console.error('Error removing subject:', error);
      setStatus('Network error while removing subject.');
    }
  }

  async function logout() {
    if (!loggedInId) {
      setStatus('You are not logged in.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/logout`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Logout failed.');
        return;
      }
      setLoggedInId('');
      setSubjects([]);
      setSubjectName('');
      setStatus(data.status || 'Logged out.');
    } catch (error) {
      console.error('Error logging out:', error);
      setStatus('Network error while logging out.');
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="eyebrow">UP Visayas ·  Computerized Registration and Student Information System</span>
        <h1>Student Dashboard</h1>
      </header>

      <div className="card">
        {(!loggedInId) ? (
          <div>
            <h2>Login</h2>
            <input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID"
            />
            <button onClick={login}>Login</button>
          </div>
        ) : (
          <div>
            <div className="card-row">
              <h2 style={{ marginBottom: 0 }}>Hello, {loggedInId}!</h2>
              <button className="btn-secondary" onClick={logout}>
                Logout
              </button>
            </div>

            <section style={{ marginTop: 20 }}>
              <h3>Current Subjects</h3>
              {subjects.length > 0 ? (
                <ul className="subject-list">
                  {subjects.map((subject) => (
                    <li key={subject.id} className="subject-item">
                      <div>
                        <span className="subject-name">{subject.name}</span>
                        <span className="subject-meta">
                          Units: {subject.unit} | Course ID: {subject.courseId}
                        </span>
                      </div>
                      <button
                        className="btn-remove"
                        onClick={() => removeSubject(subject.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="helper-text">No subjects yet. Add one below.</p>
              )}
            </section>
          </div>
        )}
      </div>

      {loggedInId ? (
        <section className="card">
          <h2>Add a Subject</h2>
          <input
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="Enter subject name"
          />
          <input
            value={subjectUnit}
            onChange={(e) => setSubjectUnit(e.target.value)}
            placeholder="Enter units"
          />
          <input
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="Enter course ID"
          />
          <button onClick={addSubject}>Add Subject</button>
        </section>
      ) : (
        <p className="helper-text">Please log in with a student ID to see and manage subjects.</p>
      )}

      {status && <div className="status-message">{status}</div>}
    </div>
  );
}