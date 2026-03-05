import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@pages/Dashboard/Dashboard';
import MemoryDetail from '@pages/MemoryDetail/MemoryDetail';
import AddMemory from '@pages/AddMemory/AddMemory';
import { UserProfile } from '@interfaces/UserProfile';
import { getOrCreateProfile } from '@services/memoryService';
import './App.css';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      try {
        // First-run: creates a default profile if none exists.
        // Change yourName and childrenNames here, or build a settings page later.
        const p = await getOrCreateProfile({
          yourName: 'Dad',
          childrenNames: 'Emma and James',
        });
        setProfile(p);
      } catch (err) {
        setError(
          'Could not connect to Neon database. ' +
          'Check REACT_APP_NEON_DATABASE_URL in your .env file and that the ' +
          'SQL schema has been run in your Neon dashboard.'
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
        <code>REACT_APP_NEON_DATABASE_URL=postgresql://...</code>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Dashboard profile={profile} />} />
          <Route path="/memory/:id" element={<MemoryDetail profile={profile} />} />
          <Route path="/add" element={<AddMemory profile={profile} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
