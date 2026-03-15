import { useState } from 'react';
import { Gift } from '@interfaces/Gift';
import './GiftBox.css';

type GiftBoxProps = {
  gift: Gift;
};

export default function GiftBox({ gift }: GiftBoxProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="gift-box">
      <button
        className="gift-box__header"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="gift-box__icon">🎁</span>
        <div className="gift-box__header-text">
          <h3 className="gift-box__title">{gift.title}</h3>
          <p className="gift-box__subtitle">A gift left for you inside this memory</p>
        </div>
        <span className="gift-box__chevron">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <div className="gift-box__reveal">
          <p className="gift-box__message">{gift.message}</p>
          {gift.mediaUrl && (
            <a
              href={gift.mediaUrl}
              className="gift-box__media-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open attached file →
            </a>
          )}
          {gift.revealDate && (
            <p className="gift-box__reveal-date">
              To be opened: {gift.revealDate}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
