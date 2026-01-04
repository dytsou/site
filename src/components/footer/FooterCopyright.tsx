import './Footer.css';

export function FooterCopyrightComponent() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="footer-divider">
      <p className="footer-copyright">
        {currentYear} Dong-You Tsou. All rights reserved.
      </p>
    </div>
  );
}
