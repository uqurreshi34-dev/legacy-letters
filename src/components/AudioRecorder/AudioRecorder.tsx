import { useRef, useState } from 'react';
import './AudioRecorder.css';

type AudioRecorderProps = {
  onAudioReady: (file: File | Blob, previewUrl: string) => void;
};

export default function AudioRecorder({ onAudioReady }: AudioRecorderProps) {
  const [mode, setMode] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async (): Promise<void> => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setMode('recorded');
        onAudioReady(blob, url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setMode('recording');
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError('Microphone access denied. Please allow microphone access in your browser.');
    }
  };

  const stopRecording = (): void => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMode('recorded');
    onAudioReady(file, url);
  };

  const handleReset = (): void => {
    setMode('idle');
    setPreviewUrl(null);
    setRecordingSeconds(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-recorder">
      {error && <p className="audio-recorder__error">{error}</p>}

      {mode === 'idle' && (
        <div className="audio-recorder__options">
          <button
            className="audio-recorder__btn audio-recorder__btn--record"
            onClick={startRecording}
          >
            🎙 Record your voice
          </button>
          <span className="audio-recorder__or">or</span>
          <button
            className="audio-recorder__btn audio-recorder__btn--upload"
            onClick={() => fileInputRef.current?.click()}
          >
            📁 Upload audio file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      )}

      {mode === 'recording' && (
        <div className="audio-recorder__recording">
          <div className="audio-recorder__pulse" />
          <span className="audio-recorder__timer">{formatTime(recordingSeconds)}</span>
          <button
            className="audio-recorder__btn audio-recorder__btn--stop"
            onClick={stopRecording}
          >
            ⏹ Stop recording
          </button>
        </div>
      )}

      {mode === 'recorded' && previewUrl && (
        <div className="audio-recorder__preview">
          <audio controls src={previewUrl} className="audio-recorder__player" />
          <button className="audio-recorder__reset" onClick={handleReset}>
            ↺ Record or upload again
          </button>
        </div>
      )}
    </div>
  );
}
