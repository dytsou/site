import { Link } from 'react-router-dom';
import { FooterLink } from './footerLinksConfig';

interface FooterLinkProps {
  link: FooterLink;
}

export function FooterLinkComponent({ link }: FooterLinkProps) {
  if (link.internal) {
    return (
      <Link to={link.href} className="footer-link">
        {link.label}
      </Link>
    );
  }

  return (
    <a
      href={link.href}
      className="footer-link"
      {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {link.label}
    </a>
  );
}
