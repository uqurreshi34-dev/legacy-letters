import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GiftBox from '@components/GiftBox/GiftBox';
import VideoPlayer from '@components/VideoPlayer/VideoPlayer';
import { Memory } from '@interfaces/Memory';
import { UserProfile } from '@interfaces/UserProfile';
import { generateMemoryScript } from '@services/claudeService';
import { generateVideoFromPhoto } from '@services/videoService';
import { uploadPhoto } from '@services/uploadService';
import {
  getMemoryById,
  updateMemoryScript,
  updateMemoryVideo,
  updateMemoryPhoto,
  deleteMemory,
  setMemoryStatus,
} from '@services/memoryService';
import './MemoryDetail.css';

type GetToken = () => Promise<string | null>;

type MemoryDetailProps = {
  profile: UserProfile;
  getToken: GetToken;
};

export default function MemoryDetail({ profile, getToken }: MemoryDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [replacingPhoto, setReplacingPhoto] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async (): Promise<void> => {
      try {
        const data = await getMemoryById(id, getToken);
        setMemory(data);
      } catch {
        setError('Could not load memory.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, getToken]);

  const handleGenerateScript = async (): Promise<void> => {
    if (!memory) return;
    setGeneratingScript(true);
    setError(null);
    try {
      const result = await generateMemoryScript(memory, profile);
      await updateMemoryScript(memory.id, result.script, getToken);
      setMemory((prev) =>
        prev ? { ...prev, generatedScript: result.script, status: 'ready' } : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Script generation failed.');
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleGenerateVideo = async (): Promise<void> => {
    if (!memory?.generatedScript) return;
    setGeneratingVideo(true);
    setError(null);
    try {
      await setMemoryStatus(memory.id, 'processing', getToken);
      const result = await generateVideoFromPhoto(
        memory.id,
        memory.photoUrl,
        memory.generatedScript
      );
      await updateMemoryVideo(memory.id, result.videoUrl, getToken);
      setMemory((prev) =>
        prev ? { ...prev, videoUrl: result.videoUrl, status: 'ready' } : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video generation failed.');
      await setMemoryStatus(memory.id, 'ready', getToken);
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleReplacePhoto = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !memory) return;
    setReplacingPhoto(true);
    setError(null);
    try {
      const newUrl = await uploadPhoto(file);
      await updateMemoryPhoto(memory.id, newUrl, getToken);
      setMemory((prev) => prev ? { ...prev, photoUrl: newUrl } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo replacement failed.');
    } finally {
      setReplacingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!memory) return;
    try {
      await deleteMemory(memory.id, getToken);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="memory-detail__loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="memory-detail__not-found">
        <p>Memory not found.</p>
        <button onClick={() => navigate('/')}>← Back to vault</button>
      </div>
    );
  }

  return (
    <main className="memory-detail">
      <div className="memory-detail__topbar">
        <button className="memory-detail__back" onClick={() => navigate('/')}>
          ← All Memories
        </button>

        {!confirmDelete ? (
          <button
            className="memory-detail__delete-btn"
            onClick={() => setConfirmDelete(true)}
          >
            Delete memory
          </button>
        ) : (
          <div className="memory-detail__confirm-delete">
            <span>Are you sure?</span>
            <button className="memory-detail__confirm-yes" onClick={handleDelete}>
              Yes, delete
            </button>
            <button
              className="memory-detail__confirm-no"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="memory-detail__hero">
        <img
          src={memory.photoUrl}
          alt={memory.location}
          className="memory-detail__hero-img"
        />
        <div className="memory-detail__hero-grad" />
        <div className="memory-detail__hero-text">
          <h1 className="memory-detail__title">{memory.location}</h1>
          <p className="memory-detail__date">{memory.dateTaken}</p>
        </div>

        <button
          className="memory-detail__replace-photo"
          onClick={() => photoInputRef.current?.click()}
          disabled={replacingPhoto}
        >
          {replacingPhoto ? 'Uploading…' : '↺ Replace photo'}
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleReplacePhoto}
        />
      </div>

      {error && <div className="memory-detail__error">{error}</div>}

      {memory.description && (
        <div className="memory-detail__description">
          <p>{memory.description}</p>
        </div>
      )}

      {memory.videoUrl && (
        <VideoPlayer
          videoUrl={memory.videoUrl}
          script={memory.generatedScript}
        />
      )}

      <div className="memory-detail__letter-box">
        <div className="memory-detail__letter-header">
          <span className="memory-detail__letter-icon">🎬</span>
          <h2 className="memory-detail__letter-title">Video Letter Script</h2>
        </div>

        {memory.generatedScript ? (
          <div>
            <p className="memory-detail__script">{memory.generatedScript}</p>
            <div className="memory-detail__actions">
              {!memory.videoUrl && (
                <button
                  className="btn-primary"
                  onClick={handleGenerateVideo}
                  disabled={generatingVideo}
                >
                  {generatingVideo ? (
                    <>
                      <span className="spinner-inline" />
                      Generating video… (2–4 min)
                    </>
                  ) : (
                    '▶ Generate Video from This Script'
                  )}
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={handleGenerateScript}
                disabled={generatingScript}
              >
                {generatingScript ? 'Writing…' : '↺ Regenerate Script'}
              </button>
            </div>
          </div>
        ) : (
          <div className="memory-detail__generate-prompt">
            {generatingScript ? (
              <div className="memory-detail__generating">
                <div className="spinner" />
                <p>Writing your letter from this memory…</p>
              </div>
            ) : (
              <>
                <p className="memory-detail__generate-text">
                  Ready to bring this memory to life? The AI will write a
                  personal letter in your voice from this photo.
                </p>
                <button className="btn-primary" onClick={handleGenerateScript}>
                  ✦ Generate My Video Letter
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {memory.gift && <GiftBox gift={memory.gift} />}
    </main>
  );
}
