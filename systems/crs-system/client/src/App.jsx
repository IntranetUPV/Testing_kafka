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
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>CRS Student Dashboard</h1>

      <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
        {(!loggedInId) ? (

          <div>
            <h2>Login</h2>
            <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter student ID"
            style={{ width: '100%', padding: 8, marginBottom: 8, boxSizing: 'border-box' }}
            />
            <button onClick={login} style={{ padding: '10px 16px' }}>
              Login
            </button>
          </div>
          ) : (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h2>Hello {loggedInId}!</h2>
                <button onClick={logout} style={{ padding: '10px 16px', height: '40px'}}>
                  Logout
                </button>
              </div>
              <section style={{ marginBottom: 24 }}>
                <h3>Current Subjects</h3>
                {subjects.length > 0 ? (
                  <ul style={{ paddingLeft: 20 }}>
                    {subjects.map((subject) => (
                      <li key={subject.id} style={{ marginBottom: 12 }}>
                        <strong>{subject.name}</strong>
                        <span style={{ marginLeft: 12, color: '#555' }}>
                          Units: {subject.unit} | Course ID: {subject.courseId}
                        </span>
                        <button
                          onClick={() => removeSubject(subject.id)}
                          style={{ marginLeft: 12, padding: '4px 8px' }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No subjects yet. Add one below.</p>
                )}
              </section>


            </div>
          )
        }        
      </div>

      {loggedInId ? (
        <>
          <section style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
            <h2>Add a Subject</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              <input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Enter subject name"
                style={{ padding: 8, width: '100%', boxSizing: 'border-box'}}
              />
              <input
                value={subjectUnit}
                onChange={(e) => setSubjectUnit(e.target.value)}
                placeholder="Enter units"
                style={{ padding: 8, width: '100%', boxSizing: 'border-box'}}
              />
              <input
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="Enter course ID"
                style={{ padding: 8, width: '100%', boxSizing: 'border-box'}}
              />
              <button onClick={addSubject} style={{ padding: '10px 16px', width: 'fit-content' }}>
                Add Subject
              </button>
            </div>
          </section>
        </>
      ) : (
        <p>Please log in with a student ID to see and manage subjects.</p>
      )}
    </div>
  );
}
