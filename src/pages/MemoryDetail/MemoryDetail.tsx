import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GiftBox from '@components/GiftBox/GiftBox';
import VideoPlayer from '@components/VideoPlayer/VideoPlayer';
import { Memory } from '@interfaces/Memory';
import { UserProfile } from '@interfaces/UserProfile';
import { generateMemoryScript } from '@services/claudeService';
import { generateVideoFromPhoto } from '@services/videoService';
import {
  getMemoryById,
  updateMemoryScript,
  updateMemoryVideo,
  setMemoryStatus,
} from '@services/memoryService';
import './MemoryDetail.css';

interface MemoryDetailProps {
  profile: UserProfile;
}

const MemoryDetail: React.FC<MemoryDetailProps> = ({ profile }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async (): Promise<void> => {
      try {
        const data = await getMemoryById(id);
        setMemory(data);
      } catch (err) {
        setError('Could not load memory.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleGenerateScript = async (): Promise<void> => {
    if (!memory) return;
    setGeneratingScript(true);
    setError(null);
    try {
      const result = await generateMemoryScript(memory, profile);
      await updateMemoryScript(memory.id, result.script);
      setMemory((prev) => prev ? { ...prev, generatedScript: result.script, status: 'ready' } : prev);
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
      await setMemoryStatus(memory.id, 'processing');
      const result = await generateVideoFromPhoto(
        memory.id,
        memory.photoUrl,
        memory.generatedScript
      );
      await updateMemoryVideo(memory.id, result.videoUrl);
      setMemory((prev) =>
        prev ? { ...prev, videoUrl: result.videoUrl, status: 'ready' } : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video generation failed.');
      await setMemoryStatus(memory.id, 'ready');
    } finally {
      setGeneratingVideo(false);
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
      <button className="memory-detail__back" onClick={() => navigate('/')}>
        ← All Memories
      </button>

      {/* Hero photo */}
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
      </div>

      {error && <div className="memory-detail__error">{error}</div>}

      {/* Video */}
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
                      Generating video… (this takes 2–4 min)
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
                  Ready to bring this memory to life? The AI will write a personal
                  letter in your voice from this photo.
                </p>
                <button className="btn-primary" onClick={handleGenerateScript}>
                  ✦ Generate My Video Letter
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Gift */}
      {memory.gift && <GiftBox gift={memory.gift} />}
    </main>
  );
};

export default MemoryDetail;
