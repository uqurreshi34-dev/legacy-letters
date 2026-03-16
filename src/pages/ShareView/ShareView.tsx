import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Memory } from '@interfaces/Memory';
import GiftBox from '@components/GiftBox/GiftBox';
import VideoPlayer from '@components/VideoPlayer/VideoPlayer';
import './ShareView.css';

export default function ShareView() {
  const { token } = useParams<{ token: string }>();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? 'Invalid share link');
        }
        const data = await res.json();
        setMemories(data.memories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load vault');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="share-view__loading">
        <div className="spinner" />
        <p>Loading memories…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="share-view__error">
        <h2>Link not found</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Memory detail view
  if (selectedMemory) {
    return (
      <main className="share-view share-view--detail">
        <button
          className="share-view__back"
          onClick={() => setSelectedMemory(null)}
        >
          ← All Memories
        </button>

        <div className="share-view__hero">
          <img
            src={selectedMemory.photoUrl}
            alt={selectedMemory.location}
            className="share-view__hero-img"
          />
          <div className="share-view__hero-grad" />
          <div className="share-view__hero-text">
            <h1 className="share-view__title">{selectedMemory.location}</h1>
            <p className="share-view__date">{selectedMemory.dateTaken}</p>
          </div>
        </div>

        {selectedMemory.description && (
          <div className="share-view__description">
            <p>{selectedMemory.description}</p>
          </div>
        )}

        {selectedMemory.videoUrl && (
          <VideoPlayer
            videoUrl={selectedMemory.videoUrl}
            script={selectedMemory.generatedScript}
          />
        )}

        {selectedMemory.generatedScript && !selectedMemory.videoUrl && (
          <div className="share-view__letter-box">
            <div className="share-view__letter-header">
              <span>🎬</span>
              <h2 className="share-view__letter-title">A letter for you</h2>
            </div>
            <p className="share-view__script">{selectedMemory.generatedScript}</p>
          </div>
        )}

        {selectedMemory.gift && <GiftBox gift={selectedMemory.gift} />}
      </main>
    );
  }

  // Memory grid view
  return (
    <main className="share-view">
      <header className="share-view__header">
        <h1 className="share-view__vault-title">Memory Vault</h1>
        <p className="share-view__vault-sub">
          {memories.length} {memories.length === 1 ? 'memory' : 'memories'} left for you
        </p>
      </header>

      {memories.length === 0 ? (
        <div className="share-view__empty">
          <p>No memories have been added yet.</p>
        </div>
      ) : (
        <div className="share-view__grid">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="share-view__card"
              onClick={() => setSelectedMemory(memory)}
            >
              <div className="share-view__card-photo">
                <img
                  src={memory.photoUrl}
                  alt={memory.location}
                  className="share-view__card-img"
                />
                <div className="share-view__card-overlay" />
                {memory.status === 'ready' && (
                  <span className="share-view__card-badge">▶ Letter Ready</span>
                )}
                {memory.gift && (
                  <span className="share-view__card-gift">🎁</span>
                )}
              </div>
              <div className="share-view__card-info">
                <p className="share-view__card-location">{memory.location}</p>
                <p className="share-view__card-date">{memory.dateTaken}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
