import React from 'react';
import { Link } from 'react-router-dom';
import './LegalDocument.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-document">
          <div className="legal-header">
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last updated: June 12, 2025</p>
          </div>

          <div className="legal-content">
            <section>
              <h2>1. Information We Collect</h2>
              <h3>1.1 Account Information</h3>
              <p>
                When you create an account, we collect your username, email address, 
                and password (stored securely using industry-standard hashing).
              </p>

              <h3>1.2 Story and Prompt Data</h3>
              <p>
                We store the scenarios, prompts, and stories you create to provide 
                our services. This content is private to your account and is not 
                shared with other users unless you explicitly choose to do so.
              </p>

              <h3>1.3 API Keys (BYOK Users)</h3>
              <p>
                If you use the "Bring Your Own Key" tier, we store your API keys 
                encrypted at rest using AES-256 encryption. These keys are only 
                used to make AI requests on your behalf and are never logged or 
                transmitted in plain text.
              </p>

              <h3>1.4 Usage Data</h3>
              <p>
                We collect usage statistics including feature usage, generation counts,
                and performance metrics to improve our service. This data is anonymized
                and aggregated.
              </p>
            </section>

            <section>
              <h2>2. How We Use Your Information</h2>
              <ul>
                <li>Provide and maintain our story generation services</li>
                <li>Process AI generation requests using your prompts</li>
                <li>Manage your account and subscription</li>
                <li>Send important service notifications</li>
                <li>Improve our services and user experience</li>
                <li>Provide customer support</li>
              </ul>
            </section>

            <section>
              <h2>3. Data Sharing and Disclosure</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information
                to third parties except as described below:
              </p>
              <ul>
                <li><strong>AI Service Providers:</strong> Your prompts are sent to AI providers (OpenAI, Anthropic, etc.) to generate content. These providers have their own privacy policies.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights.</li>
                <li><strong>Service Providers:</strong> We may use trusted third-party services for hosting, analytics, and payment processing.</li>
              </ul>
            </section>

            <section>
              <h2>4. Data Security</h2>
              <p>
                We implement industry-standard security measures including:
              </p>
              <ul>
                <li>HTTPS encryption for all data transmission</li>
                <li>AES-256 encryption for sensitive data at rest</li>
                <li>Regular security audits and updates</li>
                <li>Limited access controls for our staff</li>
                <li>Secure password hashing using bcrypt</li>
              </ul>
            </section>

            <section>
              <h2>5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Export your stories and scenarios</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section>
              <h2>6. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
                <br />
                Email: privacy@storywriter.app
                <br />
                Address: [Company Address]
              </p>
            </section>
          </div>

          <div className="legal-footer">
            <Link to="/terms" className="legal-footer-link">Terms of Service</Link>
            <span className="legal-separator">•</span>
            <Link to="/" className="legal-footer-link">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
