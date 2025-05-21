'use client';
import React, { useState } from 'react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AskTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;
    const userMessage: Message = { role: 'user', content: input };
    setMessages((msgs) => [...msgs, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post('/api/ask', {
        message: userMessage.content,
      });
      const data = res.data.response;
      // If response is an array of tweets, format as a string for display
      let assistantContent: string;
      if (Array.isArray(data)) {
        if (data.length === 0) {
          assistantContent = 'No relevant tweets found.';
        } else {
          assistantContent = data
            .map(
              (tweet) =>
                `@${tweet.username} (${new Date(tweet.timestamp).toLocaleString()}):\n${tweet.text}\n`,
            )
            .join('\n');
        }
      } else {
        assistantContent = data;
      }
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', content: assistantContent },
      ]);
    } catch {
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', content: 'Error: Failed to get response.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Query Vector Space</h2>
      <div
        style={{
          border: '1px solid #eee',
          borderRadius: 8,
          minHeight: 300,
          padding: 16,
          marginBottom: 16,
          background: '#fafbfc',
          overflowY: 'auto',
          maxHeight: 400,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: '#aaa' }}>Start the conversation...</div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.role === 'user' ? 'right' : 'left',
              margin: '8px 0',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                background: msg.role === 'user' ? '#dbeafe' : '#e5e7eb',
                color: '#222',
                borderRadius: 16,
                padding: '8px 14px',
                maxWidth: '80%',
                wordBreak: 'break-word',
                whiteSpace: 'pre-line',
              }}
            >
              {msg.content}
            </span>
          </div>
        ))}
        {loading && (
          <div style={{ color: '#aaa', marginTop: 8 }}>Thinking...</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Type your question..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: '1px solid #ccc',
          }}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '0 18px',
            borderRadius: 8,
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            fontSize: 16,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
