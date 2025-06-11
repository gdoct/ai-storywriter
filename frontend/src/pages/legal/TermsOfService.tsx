import React from 'react';
import { Link } from 'react-router-dom';
import './LegalDocument.css';

const TermsOfService: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-document">
          <div className="legal-header">
            <h1>Terms of Service</h1>
            <p className="last-updated">Last updated: June 12, 2025</p>
          </div>

          <div className="legal-content">
            <section>
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using StoryWriter, you accept and agree to be bound 
                by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2>2. Description of Service</h2>
              <p>
                StoryWriter is an AI-powered story generation platform that helps users
                create narratives using artificial intelligence. We offer three service
                tiers: Free, BYOK (Bring Your Own Key), and Premium.
              </p>

              <h3>2.1 Service Tiers</h3>
              <ul>
                <li><strong>Free:</strong> Limited daily generations with our AI models</li>
                <li><strong>BYOK:</strong> Unlimited use with your own AI provider API keys</li>
                <li><strong>Premium:</strong> Unlimited use with our premium AI models using a credit system</li>
              </ul>
            </section>

            <section>
              <h2>3. User Accounts</h2>
              <h3>3.1 Account Creation</h3>
              <p>
                You must provide accurate and complete information when creating an account.
                You are responsible for maintaining the security of your account credentials.
              </p>

              <h3>3.2 Account Responsibilities</h3>
              <ul>
                <li>You are responsible for all activity under your account</li>
                <li>You must notify us immediately of any unauthorized use</li>
                <li>You must not share your account credentials</li>
                <li>You must be at least 13 years old to use our service</li>
              </ul>
            </section>

            <section>
              <h2>4. Acceptable Use</h2>
              <h3>4.1 Permitted Uses</h3>
              <p>You may use StoryWriter for lawful purposes including:</p>
              <ul>
                <li>Creating original fictional content</li>
                <li>Educational and research purposes</li>
                <li>Personal and commercial storytelling projects</li>
              </ul>

              <h3>4.2 Prohibited Uses</h3>
              <p>You may not use StoryWriter to:</p>
              <ul>
                <li>Generate harmful, illegal, or offensive content</li>
                <li>Create content that infringes on others' intellectual property</li>
                <li>Attempt to reverse engineer or hack our systems</li>
                <li>Use automated tools to abuse our rate limits</li>
                <li>Generate spam or malicious content</li>
                <li>Create content intended to deceive or mislead others</li>
              </ul>
            </section>

            <section>
              <h2>5. Intellectual Property</h2>
              <h3>5.1 Your Content</h3>
              <p>
                You retain ownership of the stories and scenarios you create. By using
                our service, you grant us a limited license to process and store your
                content to provide our services.
              </p>

              <h3>5.2 Our Content</h3>
              <p>
                The StoryWriter platform, including its design, features, and technology,
                is owned by us and protected by intellectual property laws.
              </p>
            </section>

            <section>
              <h2>6. Payment and Refunds</h2>
              <h3>6.1 Premium Credits</h3>
              <p>
                Premium tier users purchase credits for AI generation. Credits are
                non-transferable and do not expire for 12 months from purchase date.
              </p>

              <h3>6.2 Refund Policy</h3>
              <p>
                Refunds are available within 7 days of purchase for unused credits.
                Contact support for refund requests.
              </p>
            </section>

            <section>
              <h2>7. Service Availability</h2>
              <p>
                We strive for high availability but do not guarantee uninterrupted access.
                We may perform maintenance, updates, or experience outages that temporarily
                affect service availability.
              </p>
            </section>

            <section>
              <h2>8. Limitation of Liability</h2>
              <p>
                StoryWriter is provided "as is" without warranties. We are not liable
                for any damages arising from your use of our service, including but not
                limited to lost data, business interruption, or consequential damages.
              </p>
            </section>

            <section>
              <h2>9. Termination</h2>
              <p>
                We may terminate or suspend your account for violations of these terms.
                You may delete your account at any time through your account settings.
              </p>
            </section>

            <section>
              <h2>10. Contact Information</h2>
              <p>
                For questions about these Terms of Service, contact us at:
                <br />
                Email: legal@storywriter.app
                <br />
                Address: [Company Address]
              </p>
            </section>
          </div>

          <div className="legal-footer">
            <Link to="/privacy" className="legal-footer-link">Privacy Policy</Link>
            <span className="legal-separator">•</span>
            <Link to="/" className="legal-footer-link">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
