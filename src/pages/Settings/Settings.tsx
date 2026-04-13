import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { UserProfile } from '@interfaces/UserProfile';
import { generateShareToken } from '@services/memoryService';
import './Settings.css';

type GetToken = () => Promise<string | null>;

type SettingsProps = {
  profile: UserProfile;
  getToken: GetToken;
};

export default function Settings({ profile, getToken }: SettingsProps) {
  const navigate = useNavigate();
  const { user } = useUser();

  const [yourName, setYourName] = useState(profile.yourName);
  const [childrenNames, setChildrenNames] = useState(profile.childrenNames);
  const [heygenApiKey, setHeygenApiKey] = useState(
    (user?.publicMetadata?.heygenApiKey as string) || ''
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generatingShare, setGeneratingShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async (): Promise<void> => {
    if (!yourName.trim()) { setError('Please enter your name.'); return; }
    if (!childrenNames.trim()) { setError("Please enter your children's names."); return; }

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          yourName: yourName.trim(),
          childrenNames: childrenNames.trim(),
          heygenApiKey: heygenApiKey.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      await user?.reload();
      setSaved(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateShareLink = async (): Promise<void> => {
    setGeneratingShare(true);
    try {
      const token = await generateShareToken(getToken);
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate share link.');
    } finally {
      setGeneratingShare(false);
    }
  };

  const handleCopy = (): void => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="settings">
      <button className="settings__back" onClick={() => navigate('/')}>
        ← Back to vault
      </button>

      <h1 className="settings__title">Settings</h1>
      <p className="settings__sub">
        Manage your vault identity, API keys, and share access.
      </p>

      {error && <div className="settings__error">{error}</div>}
      {saved && <div className="settings__success">✓ Saved — redirecting…</div>}

      <div className="settings__card">
        <section className="settings__section">
          <label className="settings__label">Your name</label>
          <p className="settings__hint">
            How you want to be known in your video letters.
          </p>
          <input
            className="settings__input"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            placeholder="e.g. Dad, Papa, Michael…"
          />
        </section>

        <section className="settings__section">
          <label className="settings__label">Your children's names</label>
          <p className="settings__hint">
            These names appear in every generated script.
          </p>
          <input
            className="settings__input"
            value={childrenNames}
            onChange={(e) => setChildrenNames(e.target.value)}
            placeholder="e.g. Emma and James…"
          />
        </section>

        <section className="settings__section">
          <label className="settings__label">HeyGen API Key</label>
          <p className="settings__hint">
            Required to generate lip-synced videos. Get your key at{' '}
            <a
              href="https://app.heygen.com/settings?nav=API"
              target="_blank"
              rel="noopener noreferrer"
              className="settings__link"
            >
              app.heygen.com/settings
            </a>
            . Your key is stored securely and never shared.
          </p>
          <input
            className="settings__input"
            value={heygenApiKey}
            onChange={(e) => setHeygenApiKey(e.target.value)}
            placeholder="e.g. MzY4Y2Fm..."
            type="password"
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

      <div className="settings__card settings__share-card">
        <h2 className="settings__share-title">Share with your kids</h2>
        <p className="settings__hint">
          Generate a private link. Anyone with this link can view your vault
          in read-only mode — no account needed.
        </p>

        {shareUrl ? (
          <div className="settings__share-url-box">
            <p className="settings__share-url">{shareUrl}</p>
            <button className="btn-secondary" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
          </div>
        ) : (
          <button
            className="btn-secondary"
            onClick={handleGenerateShareLink}
            disabled={generatingShare}
          >
            {generatingShare ? (
              <>
                <span className="spinner-inline spinner-inline--dark" />
                Generating…
              </>
            ) : (
              '🔗 Generate Share Link'
            )}
          </button>
        )}

        {shareUrl && (
          <>
            <p className="settings__share-warning">
              ⚠ Generating a new link will invalidate the old one.
            </p>
            <button
              className="settings__regenerate"
              onClick={handleGenerateShareLink}
              disabled={generatingShare}
            >
              Generate new link (invalidates old one)
            </button>
          </>
        )}
      </div>
    </main>
  );
}
