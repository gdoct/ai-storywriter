import { Button } from '@drdata/ai-styles';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const fakeStoryStarts = [
  "Once upon a time in a land far, far away, where magic flowed freely and mythical creatures roamed the enchanted forests, a young princess named Sophia discovered an ancient prophecy foretelling a looming darkness that threatened to consume her kingdom.",
  "In a world where magic was real and dragons soared through the skies, a brave knight named Sir Galeon embarked on a perilous quest to retrieve the Dragon's Heart, a legendary artifact said to hold the key to defeating the tyrannical sorcerer Malkor.",
  "The sun set over the horizon, casting a golden glow on the ancient castle of Fantasia, as Lord Aewynn prepared for war against the invading horde of goblins and orcs, knowing that the fate of his people rested upon his shoulders.",
  "In the heart of the bustling city of Polytropis, a secret society known as the Shadow Syndicate plotted to change the world by manipulating the flow of information and controlling the city's powerful guilds, all while concealing their sinister intentions from the unsuspecting populace.",
  "Beneath the waves of the ocean, in a hidden kingdom ruled by mermaids and sea creatures, Princess Coralia discovered an ancient map leading to a sunken treasure that could restore her kingdom’s lost glory, but she knew it would attract the attention of a fearsome kraken.",
  "The wind whispered secrets through the ancient trees as Eldara, a young sorceress, prepared for her perilous journey to retrieve the stolen Sunstone from the Shadowlands.",
  "Rain lashed against the windows of Oaktree Manor, mirroring the turmoil within Lord Bravehart's heart as he discovered a hidden passage leading to a forgotten chamber filled with dangerous artifacts.",
  "As the last rays of sunlight faded, Detective Hardy surveyed the crime scene - a lavish ballroom strewn with shattered glass and crimson stains, hinting at a betrayal that shook the city’s elite.",
  "A grizzled mercenary named Jack tracked the elusive bandit leader through the treacherous canyons of the Elk Spine Canyon, determined to bring him to justice for his ruthless crimes.",
  "The shimmering portal pulsed with an otherworldly energy as Kai, a curious explorer, cautiously stepped through, unaware that he was about to enter a realm ruled by sentient crystals and enigmatic beings."
];

const HeroSection: React.FC = () => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const typeText = (text: string, callback: () => void) => {
      let charIndex = 0;
      const interval = setInterval(() => {
        if (charIndex <= text.length) {
          setCurrentText(text.slice(0, charIndex)); // Use slice to ensure proper substring handling
          charIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            callback();
          }, 2000); // Pause before moving to the next sentence
        }
      }, 100); // Typing speed
    };

    typeText(fakeStoryStarts[currentIndex], () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % fakeStoryStarts.length);
    });
  }, [currentIndex]);

  return (
    <div style={{
      padding: 'var(--spacing-5xl) var(--spacing-xl)',
      textAlign: 'center',
      background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: 'var(--font-size-6xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-lg)',
          lineHeight: '1.2'
        }}>
          Transform Your Ideas into Compelling Stories
        </h1>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-2xl)',
          maxWidth: '600px',
          margin: '0 auto var(--spacing-2xl) auto'
        }}>
          AI-powered narrative generation for writers. Create engaging stories from simple prompts with multiple AI backends.
        </p>
        <div style={{
          background: 'var(--color-surface-secondary)',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <div style={{
            color: 'var(--color-text-secondary)',
            fontFamily: 'monospace',
            fontSize: 'var(--font-size-sm)',
            textAlign: 'center'
          }}>
            {`🤖 ${currentText || '...'}`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--spacing-2xl)' }}>
          <Link to="/signup">
            <Button>
              Get Started Free
            </Button>
          </Link>
          <Link to="/features">
            <Button>
              See Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
