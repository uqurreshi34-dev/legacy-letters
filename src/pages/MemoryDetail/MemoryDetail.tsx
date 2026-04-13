import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import GiftBox from '@components/GiftBox/GiftBox';
import VideoPlayer from '@components/VideoPlayer/VideoPlayer';
import AudioRecorder from '@components/AudioRecorder/AudioRecorder';
import { Memory } from '@interfaces/Memory';
import { UserProfile } from '@interfaces/UserProfile';
import { generateMemoryScript } from '@services/claudeService';
import { generateVideoFromPhoto } from '@services/videoService';
import { uploadPhoto, uploadAudio } from '@services/uploadService';
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
  const { user } = useUser();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [replacingPhoto, setReplacingPhoto] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio state
  const [audioFile, setAudioFile] = useState<File | Blob | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Get HeyGen key from Clerk metadata
  const heygenApiKey = (user?.publicMetadata?.heygenApiKey as string) || '';

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
    if (!memory) return;
    if (!audioFile) {
      setError('Please record or upload your voice first.');
      return;
    }
    if (!heygenApiKey) {
      setError('Please add your HeyGen API key in Settings before generating videos.');
      return;
    }

    setGeneratingVideo(true);
    setUploadingAudio(true);
    setError(null);

    try {
      // Upload audio to Supabase first
      const audioUrl = await uploadAudio(audioFile);
      setUploadingAudio(false);

      await setMemoryStatus(memory.id, 'processing', getToken);

      const result = await generateVideoFromPhoto(
        memory.id,
        memory.photoUrl,
        audioUrl,
        heygenApiKey
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
      setUploadingAudio(false);
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

  const getVideoButtonLabel = (): string => {
    if (uploadingAudio) return 'Uploading audio…';
    if (generatingVideo) return 'Generating video… (2–6 min)';
    return '▶ Generate Video Letter';
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

      {/* Script section */}
      <div className="memory-detail__letter-box">
        <div className="memory-detail__letter-header">
          <span className="memory-detail__letter-icon">🎬</span>
          <h2 className="memory-detail__letter-title">Video Letter Script</h2>
        </div>

        {memory.generatedScript ? (
          <div>
            <p className="memory-detail__script">{memory.generatedScript}</p>

            {/* Voice recording section */}
            {!memory.videoUrl && (
              <div className="memory-detail__voice-section">
                <h3 className="memory-detail__voice-title">
                  Your voice
                </h3>
                <p className="memory-detail__voice-hint">
                  Read the script above aloud and record it here — or upload a pre-recorded file.
                  HeyGen will animate your photo to match your voice.
                </p>
                <AudioRecorder
                  onAudioReady={(file) => setAudioFile(file)}
                />
              </div>
            )}

            <div className="memory-detail__actions">
              {!memory.videoUrl && (
                <button
                  className="btn-primary"
                  onClick={handleGenerateVideo}
                  disabled={generatingVideo || !audioFile}
                >
                  {generatingVideo ? (
                    <>
                      <span className="spinner-inline" />
                      {getVideoButtonLabel()}
                    </>
                  ) : (
                    '▶ Generate Video Letter'
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

            {!heygenApiKey && !memory.videoUrl && (
              <p className="memory-detail__heygen-warning">
                ⚠ You need a HeyGen API key to generate videos.{' '}
                <button
                  className="memory-detail__settings-link"
                  onClick={() => navigate('/settings')}
                >
                  Add it in Settings →
                </button>
              </p>
            )}
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
                  ✦ Generate My Video Letter Script
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
