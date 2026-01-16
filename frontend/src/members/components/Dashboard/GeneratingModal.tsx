import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@drdata/ai-styles';

interface CompletedScenarioPreview {
  id: string;
  title?: string;
  synopsis?: string;
  writingStyle?: {
    genre?: string;
    tone?: string;
  };
  characters?: Array<{ name?: string }>;
}

interface GeneratingModalProps {
  isOpen: boolean;
  currentIndex?: number;
  totalCount?: number;
  isRetrying?: boolean;
  retryCount?: number;
  completedScenarios?: CompletedScenarioPreview[];
  onAbort?: () => void;
}

const GeneratingModal: React.FC<GeneratingModalProps> = ({
  isOpen,
  currentIndex = 1,
  totalCount = 1,
  isRetrying = false,
  retryCount = 0,
  completedScenarios = [],
  onAbort
}) => {
  if (!isOpen) return null;

  // Calculate progress percentage
  const progressPercent = totalCount > 1 ? ((currentIndex - 1) / totalCount) * 100 : 0;
  
  // Determine status text
  const getStatusText = () => {
    if (totalCount === 1) {
      return isRetrying 
        ? `Received incorrect result, retrying...`
        : 'Creating a new scenario based on your selections...';
    }
    
    if (isRetrying) {
      return `Received incorrect result, retrying ${currentIndex}/${totalCount}`;
    }
    
    return `Generating ${currentIndex}/${totalCount}`;
  };

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--color-surface-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 'var(--z-modal)',
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface-elevated)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-3xl)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--color-border-secondary)',
        textAlign: 'center',
        maxWidth: '450px',
        width: '90%',
        position: 'relative',
      }}>
        <div data-testid="generating-modal-spinner" style={{
          width: '60px',
          height: '60px',
          border: '4px solid var(--color-border-secondary)',
          borderTop: '4px solid var(--color-primary-500)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto var(--spacing-lg) auto',
        }} />
        
        <h3 style={{
          margin: '0 0 var(--spacing-md) 0',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
        }}>
          Generating Similar Scenario{totalCount > 1 ? 's' : ''}
        </h3>
        
        <p style={{
          margin: '0 0 var(--spacing-lg) 0',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-md)',
          lineHeight: 'var(--line-height-normal)',
          minHeight: '20px',
        }}>
          {getStatusText()}
          <br />
          This may take a few moments.
        </p>

        {/* Progress bar for multiple scenarios */}
        {totalCount > 1 && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--color-surface-tertiary)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: 'var(--spacing-sm)',
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary-500)',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Completed scenarios preview */}
        {completedScenarios.length > 0 && (
          <div style={{
            marginTop: 'var(--spacing-lg)',
            textAlign: 'left',
            maxHeight: '250px',
            overflowY: 'auto',
            borderTop: '1px solid var(--color-border-secondary)',
            paddingTop: 'var(--spacing-md)',
          }}>
            <p style={{
              margin: '0 0 var(--spacing-sm) 0',
              color: 'var(--color-text-tertiary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Created ({completedScenarios.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {completedScenarios.map((scenario, index) => {
                const firstSentence = scenario.synopsis
                  ? scenario.synopsis.split(/[.!?]/)[0] + (scenario.synopsis.match(/[.!?]/) ? scenario.synopsis.match(/[.!?]/)?.[0] : '...')
                  : 'No synopsis';
                const characterCount = scenario.characters?.length || 0;
                const genre = scenario.writingStyle?.genre;
                const tone = scenario.writingStyle?.tone;

                return (
                  <div
                    key={scenario.id || index}
                    style={{
                      padding: 'var(--spacing-md)',
                      backgroundColor: 'var(--color-surface-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-tertiary)',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      marginBottom: 'var(--spacing-xs)',
                    }}>
                      <span style={{
                        color: 'var(--color-success-500)',
                        fontSize: 'var(--font-size-sm)',
                      }}>✓</span>
                      <h4 style={{
                        margin: 0,
                        color: 'var(--color-text-primary)',
                        fontSize: 'var(--font-size-md)',
                        fontWeight: 'var(--font-weight-semibold)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {scenario.title || 'Untitled Scenario'}
                      </h4>
                    </div>
                    <p style={{
                      margin: '0 0 var(--spacing-xs) 0',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                      lineHeight: 'var(--line-height-relaxed)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {firstSentence}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: 'var(--spacing-md)',
                      flexWrap: 'wrap',
                    }}>
                      {genre && (
                        <span style={{
                          color: 'var(--color-text-tertiary)',
                          fontSize: 'var(--font-size-xs)',
                        }}>
                          📚 {genre}
                        </span>
                      )}
                      {tone && (
                        <span style={{
                          color: 'var(--color-text-tertiary)',
                          fontSize: 'var(--font-size-xs)',
                        }}>
                          🎭 {tone}
                        </span>
                      )}
                      {characterCount > 0 && (
                        <span style={{
                          color: 'var(--color-text-tertiary)',
                          fontSize: 'var(--font-size-xs)',
                        }}>
                          👥 {characterCount} character{characterCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Abort button */}
        {onAbort && (
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <Button
              variant="secondary"
              onClick={onAbort}
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              Abort
            </Button>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GeneratingModal;