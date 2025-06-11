import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Transform Your Ideas into Compelling Stories
          </h1>
          <p className="hero-subtitle">
            AI-powered narrative generation for writers. Create engaging stories 
            from simple prompts with multiple AI backends.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary btn-large">
              Get Started Free
            </Link>
            <Link to="/features" className="btn btn-secondary btn-large">
              See Demo
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="story-preview">
            <div className="typing-effect">
              <span>🤖 Writing your story...</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
