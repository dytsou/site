import { OPPORTUNITIES } from './ContactLinks';
import './Contact.css';

export function OpportunityList() {
  return (
    <div className="opportunity-container">
      <h4 className="opportunity-title">Looking for opportunities in:</h4>
      <div className="opportunity-grid">
        {OPPORTUNITIES.map((opp, index) => (
          <div key={index} className="opportunity-item">
            <span
              className={`opportunity-dot opportunity-dot-${opp.color}`}
            ></span>
            <span className="opportunity-label">{opp.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
