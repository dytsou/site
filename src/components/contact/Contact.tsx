import { Section } from '../layout/Section';
import { SectionHeader } from '../layout/SectionHeader';
import { ContactCard } from './ContactCard';
import { OpportunityList } from './OpportunityList';
import { CONTACT_CARDS } from './ContactLinks';
import './Contact.css';

export function Contact() {
  return (
    <Section id="contact">
      <SectionHeader
        title="Get In Touch"
        subtitle="I'm always open to discussing new projects, opportunities, or just having a chat about technology"
      />

      <div className="contact-container">
        <div className="contact-shell">
          <div className="contact-panel contact-panel-connect">
            <h3 className="contact-title">Let's Connect</h3>
            <div className="contact-grid" aria-label="Contact links">
              {CONTACT_CARDS.map((card) => (
                <ContactCard
                  key={card.platform}
                  platform={card.platform}
                  title={card.title}
                  subtitle={card.subtitle}
                  url={card.url}
                  icon={card.icon}
                />
              ))}
            </div>
          </div>

          <OpportunityList />
        </div>
      </div>
    </Section>
  );
}
