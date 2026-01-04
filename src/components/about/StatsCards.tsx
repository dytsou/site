import { Code2, BookOpen } from 'lucide-react';
import './About.css';

interface StatsCardsProps {
  publicRepos?: number;
}

const STATS_CARDS = [
  {
    id: 'repos',
    icon: Code2,
    color: 'blue',
    label: 'Public Repos',
    getValue: (publicRepos?: number) => publicRepos,
  },
  {
    id: 'labs',
    icon: BookOpen,
    color: 'cyan',
    label: 'Research Labs',
    getValue: () => '2',
  },
];

export function StatsCards({ publicRepos }: StatsCardsProps) {
  return (
    <div className="stats-grid">
      {STATS_CARDS.map((card) => (
        <div key={card.id} className={`stats-card stats-card-${card.color}`}>
          <div className="stats-card-header">
            <card.icon
              className={`stats-card-icon stats-card-icon-${card.color}`}
            />
            <div className={`stats-card-value stats-card-value-${card.color}`}>
              {card.getValue(publicRepos)}
            </div>
          </div>
          <div className="stats-card-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
