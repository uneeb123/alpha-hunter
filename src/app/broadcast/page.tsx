'use client';
import { useState } from 'react';

export default function BroadcastPage() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<null | 'success' | 'error'>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/maix/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h1>Broadcast Alert</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          style={{ width: '100%', fontSize: 18, padding: 12, marginBottom: 16 }}
          placeholder="Type your alert message here..."
          required
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          style={{ fontSize: 18, padding: '10px 32px' }}
        >
          {loading ? 'Sending...' : 'Send Broadcast'}
        </button>
      </form>
      {status === 'success' && (
        <div style={{ color: 'green', marginTop: 16 }}>
          Alert sent successfully!
        </div>
      )}
      {status === 'error' && (
        <div style={{ color: 'red', marginTop: 16 }}>Failed to send alert.</div>
      )}
    </div>
  );
}
