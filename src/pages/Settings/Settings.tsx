import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@interfaces/UserProfile';
import { updateProfile } from '@services/memoryService';
import './Settings.css';

type SettingsProps = {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
};

export default function Settings({ profile, onProfileUpdated }: SettingsProps) {
  const navigate = useNavigate();

  const [yourName, setYourName] = useState(profile.yourName);
  const [childrenNames, setChildrenNames] = useState(profile.childrenNames);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    if (!yourName.trim()) { setError('Please enter your name.'); return; }
    if (!childrenNames.trim()) { setError('Please enter your children\'s names.'); return; }

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const updated = await updateProfile(profile.id, {
        yourName: yourName.trim(),
        childrenNames: childrenNames.trim(),
      });
      onProfileUpdated(updated);
      setSaved(true);
      // Brief pause so user sees confirmation, then go home
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="settings">
      <button className="settings__back" onClick={() => navigate('/')}>
        ← Back to vault
      </button>

      <h1 className="settings__title">Settings</h1>
      <p className="settings__sub">
        This is how your vault identifies you and who it's for.
      </p>

      {error && <div className="settings__error">{error}</div>}
      {saved && <div className="settings__success">✓ Saved — redirecting…</div>}

      <div className="settings__card">
        <section className="settings__section">
          <label className="settings__label">
            Your name
          </label>
          <p className="settings__hint">
            How you want to be known in your video letters — Dad, Papa, Michael, whatever feels right.
          </p>
          <input
            className="settings__input"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            placeholder="e.g. Dad, Papa, Michael…"
          />
        </section>

        <section className="settings__section">
          <label className="settings__label">
            Your children's names
          </label>
          <p className="settings__hint">
            These names appear in every generated script — make them exactly how you'd address your kids.
          </p>
          <input
            className="settings__input"
            value={childrenNames}
            onChange={(e) => setChildrenNames(e.target.value)}
            placeholder="e.g. Emma and James, Aisha, my three kids…"
          />
        </section>

        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="spinner-inline" />
              Saving…
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </main>
  );
}
