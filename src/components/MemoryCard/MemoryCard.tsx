import { Memory } from '@interfaces/Memory';
import './MemoryCard.css';

type MemoryCardProps = {
  memory: Memory;
  onClick: (memory: Memory) => void;
};

export default function MemoryCard({ memory, onClick }: MemoryCardProps) {
  return (
    <div className="memory-card" onClick={() => onClick(memory)}>
      <div className="memory-card__photo">
        <img
          src={memory.photoUrl}
          alt={memory.location}
          className="memory-card__img"
        />
        <div className="memory-card__overlay" />

        <span
          className={`memory-card__badge ${
            memory.status === 'ready'
              ? 'memory-card__badge--ready'
              : 'memory-card__badge--pending'
          }`}
        >
          {memory.status === 'ready' ? '▶ Letter Ready' : '◌ Pending'}
        </span>

        {memory.gift && (
          <span className="memory-card__gift-icon" title="Contains a gift">
            🎁
          </span>
        )}
      </div>

      <div className="memory-card__info">
        <p className="memory-card__location">{memory.location}</p>
        <p className="memory-card__date">{memory.dateTaken}</p>
      </div>
    </div>
  );
}
