import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '@drdata/docomo';

const PrivacyPolicy: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--color-background)',
      padding: 'var(--spacing-2xl) var(--spacing-lg)'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto'
      }}>
        <Card style={{ 
          padding: 'var(--spacing-4xl)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <div style={{ 
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-2xl)'
          }}>
            <h1 style={{ 
              fontSize: 'var(--font-size-3xl)', 
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Privacy Policy
            </h1>
            <p style={{ 
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)'
            }}>
              Last updated: June 12, 2025
            </p>
          </div>

          <div style={{ 
            fontSize: 'var(--font-size-md)',
            lineHeight: '1.7',
            color: 'var(--color-text-primary)'
          }}>
            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                1. Information We Collect
              </h2>
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                1.1 Account Information
              </h3>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                When you create an account, we collect your username, email address, 
                and password (stored securely using industry-standard hashing).
              </p>

              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                1.2 Story and Prompt Data
              </h3>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                We store the scenarios, prompts, and stories you create to provide 
                our services. This content is private to your account and is not 
                shared with other users unless you explicitly choose to do so.
              </p>

              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                1.3 API Keys (BYOK Users)
              </h3>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                If you use the "Bring Your Own Key" tier, we store your API keys 
                encrypted at rest using AES-256 encryption. These keys are only 
                used to make AI requests on your behalf and are never logged or 
                transmitted in plain text.
              </p>

              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                1.4 Usage Data
              </h3>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                We collect usage statistics including feature usage, generation counts,
                and performance metrics to improve our service. This data is anonymized
                and aggregated.
              </p>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                2. How We Use Your Information
              </h2>
              <ul style={{ 
                paddingLeft: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Provide and maintain our story generation services</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Process AI generation requests using your prompts</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Manage your account and subscription</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Send important service notifications</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Improve our services and user experience</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Provide customer support</li>
              </ul>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                3. Data Sharing and Disclosure
              </h2>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                We do not sell, trade, or otherwise transfer your personal information
                to third parties except as described below:
              </p>
              <ul style={{ 
                paddingLeft: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <li style={{ marginBottom: 'var(--spacing-sm)' }}><strong>AI Service Providers:</strong> Your prompts are sent to AI providers (OpenAI, Anthropic, etc.) to generate content. These providers have their own privacy policies.</li>
                <li style={{ marginBottom: 'var(--spacing-sm)' }}><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights.</li>
                <li style={{ marginBottom: 'var(--spacing-sm)' }}><strong>Service Providers:</strong> We may use trusted third-party services for hosting, analytics, and payment processing.</li>
              </ul>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                4. Data Security
              </h2>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                We implement industry-standard security measures including:
              </p>
              <ul style={{ 
                paddingLeft: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>HTTPS encryption for all data transmission</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>AES-256 encryption for sensitive data at rest</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Regular security audits and updates</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Limited access controls for our staff</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Secure password hashing using bcrypt</li>
              </ul>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                5. Your Rights
              </h2>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>You have the right to:</p>
              <ul style={{ 
                paddingLeft: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Access your personal data</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Correct inaccurate data</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Delete your account and associated data</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Export your stories and scenarios</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                6. Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
                <br />
                Email: privacy@storywriter.app
                <br />
                Address: [Company Address]
              </p>
            </section>
          </div>
        </Card>

        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-md)', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Button as={Link} to="/terms" variant="secondary">
            Terms of Service
          </Button>
          <Button as={Link} to="/" variant="primary">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
