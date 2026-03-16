import { useUser, SignIn, useAuth } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@pages/Dashboard/Dashboard';
import MemoryDetail from '@pages/MemoryDetail/MemoryDetail';
import AddMemory from '@pages/AddMemory/AddMemory';
import Settings from '@pages/Settings/Settings';
import ShareView from '@pages/ShareView/ShareView';
import { UserProfile } from '@interfaces/UserProfile';
import './App.css';

export default function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  // Still loading Clerk session
  if (!isLoaded) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading your vault…</p>
      </div>
    );
  }

  // Build profile from Clerk user data
  const profile: UserProfile | null = isSignedIn && user
    ? {
        clerkId: user.id,
        yourName:      (user.publicMetadata?.yourName      as string) || '',
        childrenNames: (user.publicMetadata?.childrenNames as string) || '',
        email: user.primaryEmailAddress?.emailAddress || '',
      }
    : null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Share route is public — no auth needed */}
        <Route path="/share/:token" element={<ShareView />} />

        {/* All other routes require sign in */}
        <Route
          path="*"
          element={
            !isSignedIn ? (
              <div className="app-signin">
                <SignIn routing="hash" />
              </div>
            ) : (
              <div className="app">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Dashboard
                        profile={profile!}
                        getToken={getToken}
                      />
                    }
                  />
                  <Route
                    path="/memory/:id"
                    element={
                      <MemoryDetail
                        profile={profile!}
                        getToken={getToken}
                      />
                    }
                  />
                  <Route
                    path="/add"
                    element={
                      <AddMemory
                        profile={profile!}
                        getToken={getToken}
                      />
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <Settings
                        profile={profile!}
                        getToken={getToken}
                      />
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
