import { useRef, useState } from 'react';
import './VideoPlayer.css';

type VideoPlayerProps = {
  videoUrl: string;
  thumbnailUrl?: string;
  script?: string;
};

export default function VideoPlayer({ videoUrl, thumbnailUrl, script }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);

  const togglePlay = (): void => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying((prev) => !prev);
  };

  return (
    <div className="video-player">
      <div className="video-player__screen">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="video-player__video"
          onEnded={() => setIsPlaying(false)}
          playsInline
        />
        <button
          className={`video-player__play-btn ${isPlaying ? 'video-player__play-btn--playing' : ''}`}
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>

      {script && (
        <div className="video-player__script-section">
          <button
            className="video-player__script-toggle"
            onClick={() => setShowScript((prev) => !prev)}
          >
            {showScript ? 'Hide script' : 'Read the script'}
          </button>
          {showScript && (
            <p className="video-player__script">{script}</p>
          )}
        </div>
      )}
    </div>
  );
}
