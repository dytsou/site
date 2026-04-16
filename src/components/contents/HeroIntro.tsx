import '../hero/Hero.css';

export function HeroIntro() {
  return (
    <div className="hero-intro">
      <h1 className="hero-title">
        Hi, I'm{' '}
        <span className="hero-title-gradient">
          <span className="hero-title-nowrap">Dong-You</span> Tsou
        </span>
      </h1>
      <p className="hero-subtitle">Full-Stack Developer</p>
      <p className="hero-description">
        A computer science student at NYCU, passionate about building scalable
        systems, leading developer communities, and creating innovative
        solutions
      </p>
    </div>
  );
}
