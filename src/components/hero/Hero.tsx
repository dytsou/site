import { useNavigate } from 'react-router-dom';
import { HeroIntro } from '../contents/HeroIntro';
import { HeroActions } from './HeroActions';
import { HeroSocialLinks } from './HeroSocialLinks';
import './Hero.css';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section id="hero" className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <HeroIntro />
          <HeroActions
            onViewWork={() => navigate('/projects')}
            onGetInTouch={() => navigate('/contact')}
          />
          <HeroSocialLinks />
        </div>
      </div>
    </section>
  );
}
