import React, { useRef, useState } from 'react';
import './PhotoUploader.css';

interface PhotoUploaderProps {
  onFileSelected: (file: File, previewUrl: string) => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onFileSelected }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File): void => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelected(file, url);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`photo-uploader ${isDragging ? 'photo-uploader--dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload a photo"
    >
      {preview ? (
        <img src={preview} alt="Preview" className="photo-uploader__preview" />
      ) : (
        <div className="photo-uploader__placeholder">
          <span className="photo-uploader__icon">📷</span>
          <p className="photo-uploader__text">Click or drag a photo here</p>
          <p className="photo-uploader__hint">JPG, PNG — this photo anchors your video letter</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="photo-uploader__input"
        onChange={handleChange}
      />
    </div>
  );
};

export default PhotoUploader;
