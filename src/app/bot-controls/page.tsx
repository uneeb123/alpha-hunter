'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Response {
  name: string;
  response: string;
}

export default function BotControls() {
  const router = useRouter();
  const [responses, setResponses] = useState<Response[]>([
    { name: 'Trending Crypto News', response: '' },
    { name: 'Emerging Memecoins', response: '' },
    { name: 'Recent NFT Mints', response: '' },
  ]);

  useEffect(() => {
    // Fetch existing responses
    fetch('/api/bot-responses')
      .then((res) => res.json())
      .then((data) => {
        const updatedResponses = responses.map((r) => ({
          ...r,
          response: data[r.name]?.response || '',
        }));
        setResponses(updatedResponses);
      });
  }, []);

  const handleSave = async () => {
    try {
      await fetch('/api/bot-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responses),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to save responses:', error);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Bot Controls</h1>
      {responses.map((response, index) => (
        <div key={response.name} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>{response.name}</h2>
          <textarea
            value={response.response}
            onChange={(e) => {
              const newResponses = [...responses];
              newResponses[index].response = e.target.value;
              setResponses(newResponses);
            }}
            style={{
              width: '100%',
              minHeight: 100,
              padding: 8,
              borderRadius: 4,
              border: '1px solid #ccc',
            }}
          />
        </div>
      ))}
      <button
        onClick={handleSave}
        style={{
          padding: '8px 16px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        Save Changes
      </button>
    </div>
  );
}
