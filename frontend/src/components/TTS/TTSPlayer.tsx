import React, { useCallback, useEffect, useRef, useState } from 'react';
import './TTSPlayer.css';
import { estimateReadingTime, formatReadingTime, stripMarkdownForTTS } from './utils';

export interface TTSPlayerProps {
  text: string;
  onStatusChange?: (status: 'idle' | 'playing' | 'paused' | 'error') => void;
  className?: string;
}

interface Voice {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
}

const TTSPlayer: React.FC<TTSPlayerProps> = ({
  text,
  onStatusChange,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [cleanText, setCleanText] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<string>('');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textChunksRef = useRef<string[]>([]);
  const currentChunkRef = useRef(0);

  const loadVoices = useCallback(() => {
    const availableVoices = speechSynthesis.getVoices();
    const voiceList: Voice[] = availableVoices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      voiceURI: voice.voiceURI,
      localService: voice.localService
    }));
    
    setVoices(voiceList);
    
    // Auto-select first English voice or default voice
    if (!selectedVoice && voiceList.length > 0) {
      const englishVoice = voiceList.find(voice => voice.lang.startsWith('en'));
      setSelectedVoice(englishVoice ? englishVoice.voiceURI : voiceList[0].voiceURI);
    }
  }, [selectedVoice]);

  // Check for browser support
  useEffect(() => {
    const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    setIsSupported(supported);
    
    if (supported) {
      loadVoices();
      // Some browsers load voices asynchronously
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, [loadVoices]);

  // Split text into manageable chunks (browsers have length limits)
  useEffect(() => {
    if (text) {
      // Clean the markdown text for better TTS experience
      const cleaned = stripMarkdownForTTS(text);
      setCleanText(cleaned);
      
      // Calculate estimated reading time
      const readingMinutes = estimateReadingTime(cleaned, 180); // Slightly slower for TTS
      setEstimatedTime(formatReadingTime(readingMinutes));
      
      // Split by sentences, keeping punctuation
      const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
      const chunks: string[] = [];
      let currentChunk = '';
      
      sentences.forEach(sentence => {
        // If adding this sentence would exceed ~200 chars, start new chunk
        if (currentChunk.length + sentence.length > 200 && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      });
      
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      
      textChunksRef.current = chunks;
    }
  }, [text]);

  const createUtterance = (text: string): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find selected voice
    const voice = voices.find(v => v.voiceURI === selectedVoice);
    if (voice) {
      const speechVoice = speechSynthesis.getVoices().find(v => v.voiceURI === voice.voiceURI);
      if (speechVoice) {
        utterance.voice = speechVoice;
      }
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    return utterance;
  };

  const speak = () => {
    if (!isSupported || !cleanText) return;
    
    stop(); // Stop any current speech
    
    currentChunkRef.current = 0;
    speakCurrentChunk();
  };

  const speakCurrentChunk = () => {
    const chunks = textChunksRef.current;
    if (currentChunkRef.current >= chunks.length) {
      // Finished all chunks
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentPosition(0);
      currentChunkRef.current = 0;
      onStatusChange?.('idle');
      return;
    }

    const chunk = chunks[currentChunkRef.current];
    const utterance = createUtterance(chunk);
    
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      onStatusChange?.('playing');
    };
    
    utterance.onend = () => {
      currentChunkRef.current++;
      // Update position based on chunks completed
      const totalChunks = chunks.length;
      const progress = currentChunkRef.current / totalChunks;
      setCurrentPosition(progress * 100);
      
      // Continue with next chunk
      setTimeout(() => speakCurrentChunk(), 100);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setIsPaused(false);
      onStatusChange?.('error');
    };
    
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
      onStatusChange?.('paused');
    }
  };

  const resume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      onStatusChange?.('playing');
    }
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPosition(0);
    currentChunkRef.current = 0;
    utteranceRef.current = null;
    onStatusChange?.('idle');
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      speak();
    }
  };

  if (!isSupported) {
    return (
      <div className={`tts-player tts-unsupported ${className}`}>
        <div className="tts-error">
          <span>🔇</span>
          <span>Text-to-Speech not supported in this browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`tts-player ${className}`}>
      <div className="tts-main-controls">
        <button
          className={`tts-play-btn ${isPlaying ? 'playing' : ''} ${isPaused ? 'paused' : ''}`}
          onClick={handlePlayPause}
          disabled={!cleanText}
          title={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <button
          className="tts-stop-btn"
          onClick={stop}
          disabled={!isPlaying && !isPaused}
          title="Stop"
        >
          ⏹️
        </button>
        
        <div className="tts-progress">
          <div className="tts-progress-bar">
            <div 
              className="tts-progress-fill"
              style={{ width: `${currentPosition}%` }}
            />
          </div>
          <span className="tts-progress-text">
            {Math.round(currentPosition)}%
          </span>
          {estimatedTime && (
            <span className="tts-time-estimate" title="Estimated reading time">
              🕒 {estimatedTime}
            </span>
          )}
        </div>
        
        <button
          className="tts-settings-btn"
          onClick={() => setShowControls(!showControls)}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {showControls && (
        <div className="tts-advanced-controls">
          <div className="tts-control-group">
            <label htmlFor="voice-select">Voice:</label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={isPlaying}
            >
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang}) {voice.localService ? '🔸' : '☁️'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="tts-control-group">
            <label htmlFor="rate-slider">Speed: {rate.toFixed(1)}x</label>
            <input
              id="rate-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              disabled={isPlaying}
            />
          </div>
          
          <div className="tts-control-group">
            <label htmlFor="pitch-slider">Pitch: {pitch.toFixed(1)}</label>
            <input
              id="pitch-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              disabled={isPlaying}
            />
            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
              💡 Tip: Higher pitch values can make male voices sound more feminine
            </div>
          </div>
          
          <div className="tts-control-group">
            <label htmlFor="volume-slider">Volume: {Math.round(volume * 100)}%</label>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TTSPlayer;
