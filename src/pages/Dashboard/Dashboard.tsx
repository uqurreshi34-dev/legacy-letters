import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MemoryCard from '@components/MemoryCard/MemoryCard';
import { Memory } from '@interfaces/Memory';
import { UserProfile } from '@interfaces/UserProfile';
import { getAllMemories } from '@services/memoryService';
import './Dashboard.css';

type GetToken = () => Promise<string | null>;

type DashboardProps = {
  profile: UserProfile;
  getToken: GetToken;
};

export default function Dashboard({ profile, getToken }: DashboardProps) {
  const navigate = useNavigate();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const data = await getAllMemories(getToken);
        setMemories(data);
      } catch (err) {
        setError('Could not load memories. Check your Neon connection string in .env');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile.clerkId, getToken]);

  const readyCount = memories.filter((m) => m.status === 'ready').length;

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__header-left">
          <p className="dashboard__greeting">Hello, {profile.yourName}</p>
          <h1 className="dashboard__title">Your Memory Vault</h1>
          <p className="dashboard__meta">
            {memories.length} memories · {readyCount} letters ready for {profile.childrenNames}
          </p>
        </div>

        <div className="dashboard__header-actions">
          <button
            className="dashboard__settings-btn"
            onClick={() => navigate('/settings')}
          >
            ⚙ Settings
          </button>
          <button
            className="dashboard__add-btn"
            onClick={() => navigate('/add')}
          >
            + Add Memory
          </button>
        </div>
      </header>

      {loading && (
        <div className="dashboard__loading">
          <div className="spinner" />
          <p>Loading your memories…</p>
        </div>
      )}

      {error && (
        <div className="dashboard__error">{error}</div>
      )}

      {!loading && !error && memories.length === 0 && (
        <div className="dashboard__empty">
          <p className="dashboard__empty-text">No memories yet.</p>
          <p className="dashboard__empty-sub">
            Add your first photo to begin building your legacy.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate('/add')}
          >
            Add Your First Memory
          </button>
        </div>
      )}

      {!loading && memories.length > 0 && (
        <div className="dashboard__grid">
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onClick={() => navigate(`/memory/${memory.id}`)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
