import '../about/About.css';

export const AboutContent = () => {
  return (
    <div className="about-content">
      <div className="about-prose">
        <p className="about-text">
          I'm a Computer Science student at{' '}
          <span className="about-highlight">
            National Yang Ming Chiao Tung University
          </span>{' '}
          in Taiwan. I'm passionate about building scalable backend systems and
          creating seamless full-stack applications.
        </p>
        <p className="about-text">
          As Vice President of NYCU Software Development Club , I lead a
          community of developers and organize technical workshops. I also serve
          on the Agenda Committee for SITCON, Taiwan's largest student-run tech
          conference.
        </p>
        <p className="about-text">
          My research experience spans research testing on software quality at
          the Software Quality Lab and video-based 3D object detection on
          autonomous driving at the Applied Computing and Multimedia Lab. I
          enjoy exploring the intersection of practical engineering and
          cutting-edge research.
        </p>
      </div>
    </div>
  );
};
