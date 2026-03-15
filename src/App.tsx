import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@pages/Dashboard/Dashboard';
import MemoryDetail from '@pages/MemoryDetail/MemoryDetail';
import AddMemory from '@pages/AddMemory/AddMemory';
import Settings from '@pages/Settings/Settings';
import { UserProfile } from '@interfaces/UserProfile';
import { getOrCreateProfile } from '@services/memoryService';
import './App.css';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      try {
        const p = await getOrCreateProfile({
          yourName: '',
          childrenNames: '',
        });
        setProfile(p);
      } catch (err) {
        setError(
          'Could not connect to the database. ' +
          'Check NEON_DATABASE_URL in your Vercel environment variables.'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading your vault…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="app-error">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <code>NEON_DATABASE_URL=postgresql://...</code>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route
            path="/"
            element={<Dashboard profile={profile} />}
          />
          <Route
            path="/memory/:id"
            element={<MemoryDetail profile={profile} />}
          />
          <Route
            path="/add"
            element={<AddMemory profile={profile} />}
          />
          <Route
            path="/settings"
            element={
              <Settings
                profile={profile}
                onProfileUpdated={setProfile}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
