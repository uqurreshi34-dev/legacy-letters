import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhotoUploader from '@components/PhotoUploader/PhotoUploader';
import { CreateMemoryInput } from '@interfaces/Memory';
import { CreateGiftInput } from '@interfaces/Gift';
import { UserProfile } from '@interfaces/UserProfile';
import { createMemory, createGift } from '@services/memoryService';
import { uploadPhoto } from '@services/uploadService';
import './AddMemory.css';

type GetToken = () => Promise<string | null>;

type AddMemoryProps = {
  profile: UserProfile;
  getToken: GetToken;
};

export default function AddMemory({ profile, getToken }: AddMemoryProps) {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [dateTaken, setDateTaken] = useState('');
  const [description, setDescription] = useState('');

  const [addGift, setAddGift] = useState(false);
  const [giftTitle, setGiftTitle] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [giftRevealDate, setGiftRevealDate] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePhotoSelected = (file: File, preview: string): void => {
    setSelectedFile(file);
    setPreviewUrl(preview);
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedFile) { setError('Please upload a photo.'); return; }
    if (!location.trim()) { setError('Please enter a location.'); return; }
    if (!dateTaken.trim()) { setError('Please enter an approximate date.'); return; }

    setSaving(true);
    setError(null);

    try {
      setUploadProgress('Uploading photo…');
      const photoUrl = await uploadPhoto(selectedFile);

      setUploadProgress('Saving memory…');
      const input: CreateMemoryInput = {
        profileId: profile.clerkId,
        photoUrl,
        location: location.trim(),
        dateTaken: dateTaken.trim(),
        description: description.trim() || undefined,
      };
      const memory = await createMemory(input, getToken);

      if (addGift && giftTitle.trim() && giftMessage.trim()) {
        setUploadProgress('Saving gift…');
        const giftInput: CreateGiftInput = {
          memoryId: memory.id,
          title: giftTitle.trim(),
          message: giftMessage.trim(),
          revealDate: giftRevealDate.trim() || undefined,
        };
        await createGift(giftInput, getToken);
      }

      navigate(`/memory/${memory.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save memory.');
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  };

  return (
    <main className="add-memory">
      <button className="add-memory__back" onClick={() => navigate('/')}>
        ← Back to vault
      </button>

      <h1 className="add-memory__title">Add a Memory</h1>
      <p className="add-memory__sub">
        Upload a photo and describe the moment. The AI will turn it into a video letter.
      </p>

      {error && <div className="add-memory__error">{error}</div>}

      <div className="add-memory__card">
        <section className="add-memory__section">
          <label className="add-memory__label">Your photo</label>
          <PhotoUploader onFileSelected={handlePhotoSelected} />
          {previewUrl && (
            <p className="add-memory__upload-note">
              ✓ Photo selected — will be uploaded when you save
            </p>
          )}
        </section>

        <section className="add-memory__section">
          <label className="add-memory__label">Where was this taken?</label>
          <input
            className="add-memory__input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. My home office, the lake house, Mum's kitchen…"
          />
        </section>

        <section className="add-memory__section">
          <label className="add-memory__label">When? (approximate is fine)</label>
          <input
            className="add-memory__input"
            value={dateTaken}
            onChange={(e) => setDateTaken(e.target.value)}
            placeholder="e.g. Summer 2022, Christmas 2019, last Tuesday…"
          />
        </section>

        <section className="add-memory__section">
          <label className="add-memory__label">What was happening in this moment?</label>
          <textarea
            className="add-memory__textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you were doing, feeling, thinking. The more detail, the more personal the letter."
            rows={5}
          />
        </section>

        <div className="add-memory__divider" />

        <section className="add-memory__section">
          <label className="add-memory__gift-toggle">
            <input
              type="checkbox"
              checked={addGift}
              onChange={(e) => setAddGift(e.target.checked)}
              className="add-memory__checkbox"
            />
            <span>Attach a gift to this memory</span>
          </label>
          <p className="add-memory__gift-hint">
            A gift can be a recipe, a playlist link, a message for a milestone birthday — anything you want to leave behind.
          </p>
        </section>

        {addGift && (
          <>
            <section className="add-memory__section">
              <label className="add-memory__label">Gift title</label>
              <input
                className="add-memory__input"
                value={giftTitle}
                onChange={(e) => setGiftTitle(e.target.value)}
                placeholder="e.g. The Family Recipe Book, My Favourite Music"
              />
            </section>

            <section className="add-memory__section">
              <label className="add-memory__label">Your message</label>
              <textarea
                className="add-memory__textarea"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Write what you want them to know about this gift…"
                rows={4}
              />
            </section>

            <section className="add-memory__section">
              <label className="add-memory__label">
                When should they open it? (optional)
              </label>
              <input
                className="add-memory__input"
                value={giftRevealDate}
                onChange={(e) => setGiftRevealDate(e.target.value)}
                placeholder="e.g. On your 18th birthday, When you get married…"
              />
            </section>
          </>
        )}

        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="spinner-inline" />
              {uploadProgress}
            </>
          ) : (
            'Save This Memory →'
          )}
        </button>
      </div>
    </main>
  );
}
