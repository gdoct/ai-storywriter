import { Button } from '@drdata/ai-styles';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { generateSimilarSynopsis, generateSimilarFullScenario } from '@shared/services/similarScenarioService';

type Phase = 'configure' | 'generating-synopsis' | 'review' | 'generating-full';

interface GenerateSimilarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioCreated: (scenarioId: string) => void;
  sourceScenarioId: string;
  sourceScenarioTitle: string;
}

const GenerateSimilarModal: React.FC<GenerateSimilarModalProps> = ({
  isOpen,
  onClose,
  onScenarioCreated,
  sourceScenarioId,
  sourceScenarioTitle,
}) => {
  const [phase, setPhase] = useState<Phase>('configure');
  const [instructions, setInstructions] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedSynopsis, setGeneratedSynopsis] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setPhase('generating-synopsis');
    try {
      const result = await generateSimilarSynopsis(sourceScenarioId, instructions);
      setGeneratedTitle(result.title);
      setGeneratedSynopsis(result.synopsis);
      setPhase('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate synopsis. Please try again.');
      setPhase('configure');
    }
  };

  const handleAccept = async () => {
    setError(null);
    setPhase('generating-full');
    try {
      console.log('[GenerateSimilar] calling generate-similar-full for scenario', sourceScenarioId);
      const scenario = await generateSimilarFullScenario(sourceScenarioId, generatedTitle, generatedSynopsis);
      console.log('[GenerateSimilar] response:', scenario?.id, 'characters:', scenario?.characters?.length);
      onScenarioCreated(scenario.id!);
    } catch (err) {
      console.error('[GenerateSimilar] error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate scenario. Please try again.');
      setPhase('review');
    }
  };

  const handleTryAgain = () => {
    setGeneratedTitle('');
    setGeneratedSynopsis('');
    setError(null);
    setPhase('configure');
  };

  const handleClose = () => {
    if (phase === 'generating-synopsis' || phase === 'generating-full') return;
    setPhase('configure');
    setInstructions('');
    setGeneratedTitle('');
    setGeneratedSynopsis('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const isBusy = phase === 'generating-synopsis' || phase === 'generating-full';

  const modalContent = (
    <div
      data-testid="generate-similar-modal-outer"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'var(--color-surface-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)',
      }}
    >
      <div
        data-testid="generate-similar-modal-inner"
        style={{
          backgroundColor: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-xl)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border-secondary)',
          maxWidth: '520px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-primary)' }}>
          Generate Similar Scenario
        </h3>

        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
          Based on <strong>"{sourceScenarioTitle}"</strong>
        </p>

        {/* Always included note */}
        <div style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          backgroundColor: 'var(--color-surface-secondary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-lg)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
        }}>
          ✓ Writing style preserved &nbsp;·&nbsp; ✓ Existing characters retained &nbsp;·&nbsp; ✓ New title &amp; synopsis
        </div>

        {/* Error display */}
        {error && (
          <div style={{
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-error-surface)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-lg)',
            color: 'var(--color-error)',
            fontSize: 'var(--font-size-sm)',
          }}>
            {error}
          </div>
        )}

        {/* Phase: configure */}
        {(phase === 'configure') && (
          <>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-md)' }}>
                Instructions (optional)
              </label>
              <textarea
                data-testid="generate-similar-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder='e.g. "make it darker", "set it in space", "focus on romance"'
                rows={3}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  border: '1px solid var(--color-border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-md)',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button variant="primary" data-testid="generate-similar-generate-button" onClick={handleGenerate}>
                Generate
              </Button>
            </div>
          </>
        )}

        {/* Phase: generating synopsis */}
        {phase === 'generating-synopsis' && (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>✨</div>
            <p>Generating synopsis...</p>
          </div>
        )}

        {/* Phase: review */}
        {phase === 'review' && (
          <>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div style={{
                padding: 'var(--spacing-md)',
                border: '2px solid var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-md)',
              }}>
                <p style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)', marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-md)' }}>
                  {generatedTitle}
                </p>
              </div>
              <div style={{
                padding: 'var(--spacing-md)',
                border: '2px solid var(--color-primary)',
                borderRadius: 'var(--radius-md)',
              }}>
                <p style={{ color: 'var(--color-text-primary)', margin: 0, fontSize: 'var(--font-size-md)', lineHeight: '1.6' }}>
                  {generatedSynopsis}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Not what you wanted? Update instructions and try again:
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder='e.g. "make it more adventurous"'
                rows={2}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  border: '1px solid var(--color-border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-md)',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button variant="secondary" onClick={handleTryAgain} data-testid="generate-similar-try-again-button">
                Try Again
              </Button>
              <Button variant="primary" onClick={handleAccept} data-testid="generate-similar-accept-button">
                Accept
              </Button>
            </div>
          </>
        )}

        {/* Phase: generating full scenario */}
        {phase === 'generating-full' && (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>📖</div>
            <p>Creating full scenario...</p>
            <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>This may take a moment</p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GenerateSimilarModal;
