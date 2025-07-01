import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '@drdata/docomo';

const TermsOfService: React.FC = () => {
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
              Terms of Service
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
                1. Acceptance of Terms
              </h2>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                By accessing and using StoryWriter, you accept and agree to be bound 
                by the terms and provision of this agreement.
              </p>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                2. Description of Service
              </h2>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                StoryWriter is an AI-powered story generation platform that helps users
                create narratives using artificial intelligence. We offer three service
                tiers: Free, BYOK (Bring Your Own Key), and Premium.
              </p>

              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                2.1 Service Tiers
              </h3>
              <ul style={{ 
                paddingLeft: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}><strong>Free:</strong> Limited daily generations with our AI models</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}><strong>BYOK:</strong> Unlimited use with your own AI provider API keys</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}><strong>Premium:</strong> Unlimited use with our premium AI models using a credit system</li>
              </ul>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                3. User Accounts
              </h2>
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                3.1 Account Creation
              </h3>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                You must provide accurate and complete information when creating an account.
                You are responsible for maintaining the security of your account credentials.
              </p>

              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                3.2 Account Responsibilities
              </h3>
              <ul style={{ 
                paddingLeft: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>You are responsible for all activity under your account</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>You must notify us immediately of any unauthorized use</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>You must not share your account credentials</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>You must be at least 13 years old to use our service</li>
              </ul>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                4. Acceptable Use
              </h2>
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                4.1 Permitted Uses
              </h3>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>You may use StoryWriter for lawful purposes including:</p>
              <ul style={{ 
                paddingLeft: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Creating original fictional content</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Educational and research purposes</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Personal and commercial storytelling projects</li>
              </ul>

              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                4.2 Prohibited Uses
              </h3>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>You may not use StoryWriter to:</p>
              <ul style={{ 
                paddingLeft: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Generate harmful, illegal, or offensive content</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Create content that infringes on others' intellectual property</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Attempt to reverse engineer or hack our systems</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Use automated tools to abuse our rate limits</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Generate spam or malicious content</li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>Create content intended to deceive or mislead others</li>
              </ul>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                5. Intellectual Property
              </h2>
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                5.1 Your Content
              </h3>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                You retain ownership of the stories and scenarios you create. By using
                our service, you grant us a limited license to process and store your
                content to provide our services.
              </p>

              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                5.2 Our Content
              </h3>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                The StoryWriter platform, including its design, features, and technology,
                is owned by us and protected by intellectual property laws.
              </p>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                6. Payment and Refunds
              </h2>
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                6.1 Premium Credits
              </h3>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                Premium tier users purchase credits for AI generation. Credits are
                non-transferable and do not expire for 12 months from purchase date.
              </p>

              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-lg)'
              }}>
                6.2 Refund Policy
              </h3>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                Refunds are available within 7 days of purchase for unused credits.
                Contact support for refund requests.
              </p>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                7. Service Availability
              </h2>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                We strive for high availability but do not guarantee uninterrupted access.
                We may perform maintenance, updates, or experience outages that temporarily
                affect service availability.
              </p>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                8. Limitation of Liability
              </h2>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                StoryWriter is provided "as is" without warranties. We are not liable
                for any damages arising from your use of our service, including but not
                limited to lost data, business interruption, or consequential damages.
              </p>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                9. Termination
              </h2>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                We may terminate or suspend your account for violations of these terms.
                You may delete your account at any time through your account settings.
              </p>
            </section>

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                10. Contact Information
              </h2>
              <p>
                For questions about these Terms of Service, contact us at:
                <br />
                Email: legal@storywriter.app
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
          <Button as={Link} to="/privacy" variant="secondary">
            Privacy Policy
          </Button>
          <Button as={Link} to="/" variant="primary">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;