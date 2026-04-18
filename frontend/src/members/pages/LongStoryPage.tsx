/**
 * LongStoryPage - Full-page reader for chapter-based long story generation.
 *
 * Phases:
 *   1. Arc generation  – synopsis + chapter outline streamed, status = arc_ready
 *   2. Arc review      – user can edit titles / one-liners before committing
 *   3. Chapter gen     – one chapter at a time; user can regenerate (keeping all versions)
 *                        or advance to the next chapter
 *   4. Reading         – completed story
 *
 * URL patterns:
 *   /long-story/new?scenarioId=<id>   Create + immediately generate arc
 *   /long-story/<id>                  Open existing story
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaStop, FaPen, FaRotateRight, FaChevronRight, FaChevronLeft } from 'react-icons/fa6';
import { fetchScenarioById } from '@shared/services/scenario';
import {
  LongStory,
  LongStoryChapter,
  ChapterArcItem,
  createLongStory,
  fetchLongStoryDetail,
  updateStoryArc,
  streamGenerateArc,
  streamGenerateChapter,
  setChapterContent,
} from '@shared/services/longStoriesService';
import './LongStoryPage.css';

// ── Internal chapter representation ──────────────────────────────────────────

interface ChapterDisplay {
  chapter_number: number;
  title: string;
  one_liner?: string;
  /** Accumulates streaming tokens while status === 'generating'. */
  streamingContent: string;
  /** Completed versions; each Regenerate adds a new entry. */
  versions: string[];
  /** Index into versions[] currently shown. -1 while generating. */
  currentVersionIdx: number;
  status: 'pending' | 'generating' | 'complete';
}

function makeChapterFromArc(item: ChapterArcItem): ChapterDisplay {
  return {
    chapter_number: item.chapter_number,
    title: item.title,
    one_liner: item.one_liner,
    streamingContent: '',
    versions: [],
    currentVersionIdx: -1,
    status: 'pending',
  };
}

function makeChapterFromDb(item: ChapterArcItem, db: LongStoryChapter): ChapterDisplay {
  const content = db.content || '';
  return {
    chapter_number: item.chapter_number,
    title: item.title,
    one_liner: item.one_liner,
    streamingContent: '',
    versions: content ? [content] : [],
    currentVersionIdx: content ? 0 : -1,
    status: (db.status as ChapterDisplay['status']) || 'pending',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

const LongStoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const [searchParams] = useSearchParams();
  const scenarioIdFromUrl = searchParams.get('scenarioId');

  // Story state
  const [story, setStory] = useState<LongStory | null>(null);
  const [synopsis, setSynopsis] = useState<string>('');
  const [chapters, setChapters] = useState<ChapterDisplay[]>([]);
  const [activeChapterNum, setActiveChapterNum] = useState<number>(1);

  // Arc review state
  const [arcChapters, setArcChapters] = useState<ChapterArcItem[]>([]);
  const [isArcReady, setIsArcReady] = useState(false);
  const [isSavingArc, setIsSavingArc] = useState(false);

  // UI state
  const [isInitializing, setIsInitializing] = useState(false);
  const [isArcGenerating, setIsArcGenerating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const hasInitializedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // ── Load existing story ────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      try {
        if (storyId === 'new') { setPageLoading(false); return; }
        const detail = await fetchLongStoryDetail(parseInt(storyId!, 10));
        setStory(detail);
        setSynopsis(detail.synopsis || '');

        if (detail.story_arc) {
          try {
            const arc: ChapterArcItem[] = JSON.parse(detail.story_arc);
            setArcChapters(arc);

            if (detail.status === 'arc_ready') {
              setIsArcReady(true);
            } else {
              const byNumber = new Map(detail.chapters.map(c => [c.chapter_number, c]));
              setChapters(arc.map(item => {
                const db = byNumber.get(item.chapter_number);
                return db ? makeChapterFromDb(item, db) : makeChapterFromArc(item);
              }));
              const lastComplete = [...detail.chapters].reverse().find(c => c.status === 'complete');
              setActiveChapterNum(lastComplete?.chapter_number || 1);
            }
          } catch { setChapters([]); }
        }
      } catch {
        setError('Failed to load story. Please try again.');
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [storyId]);

  // ── Initialize new story ───────────────────────────────────────────────────

  useEffect(() => {
    if (storyId !== 'new' || !scenarioIdFromUrl || hasInitializedRef.current || pageLoading) return;
    hasInitializedRef.current = true;
    initializeAndGenerateArc();
  }, [storyId, scenarioIdFromUrl, pageLoading]);

  const initializeAndGenerateArc = async () => {
    if (!scenarioIdFromUrl) return;
    setIsInitializing(true);
    setError(null);
    try {
      const scenarioData = await fetchScenarioById(scenarioIdFromUrl);
      const newStory = await createLongStory(scenarioIdFromUrl, scenarioData.title || 'Untitled Long Story');
      setStory(newStory);
      navigate(`/long-story/${newStory.id}`, { replace: true });
      setIsInitializing(false);
      await runArcGeneration(newStory.id);
    } catch {
      setError('Failed to create story. Please try again.');
      setIsInitializing(false);
    }
  };

  // ── Phase 1: Arc generation ─────────────────────────────────────────────────

  const runArcGeneration = useCallback(async (sid: number) => {
    abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    setIsArcGenerating(true);
    setIsArcReady(false);
    setGenerationStatus('Generating story plan...');
    setError(null);
    try {
      for await (const event of streamGenerateArc(sid, signal)) {
        if (signal.aborted) break;
        switch (event.type) {
          case 'status':    setGenerationStatus(event.message); break;
          case 'synopsis':  setSynopsis(event.content); break;
          case 'arc':       setArcChapters(event.chapters); break;
          case 'arc_ready':
            setIsArcReady(true);
            setGenerationStatus('Story plan ready — review and edit below.');
            setStory(prev => prev ? { ...prev, status: 'arc_ready' } : prev);
            break;
          case 'error': setError(event.error); break;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Arc generation failed. Please try again.');
      } else {
        setGenerationStatus('Cancelled.');
      }
    } finally {
      setIsArcGenerating(false);
    }
  }, [abort]);

  // ── Phase 2: Single chapter generation ────────────────────────────────────

  const runSingleChapter = useCallback(async (sid: number, chapterNum: number) => {
    abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsGenerating(true);
    setGenerationStatus(`Writing Chapter ${chapterNum}...`);
    setError(null);
    setActiveChapterNum(chapterNum);

    // Start generating: clear streaming buffer, keep existing versions
    setChapters(prev =>
      prev.map(c =>
        c.chapter_number === chapterNum
          ? { ...c, status: 'generating', streamingContent: '' }
          : c
      )
    );

    try {
      for await (const event of streamGenerateChapter(sid, chapterNum, signal)) {
        if (signal.aborted) break;
        switch (event.type) {
          case 'status':
            setGenerationStatus(event.message);
            break;
          case 'chapter_start':
            setGenerationStatus(`Writing Chapter ${event.chapter_number}: ${event.title}...`);
            break;
          case 'token':
            setChapters(prev =>
              prev.map(c =>
                c.chapter_number === chapterNum
                  ? { ...c, streamingContent: c.streamingContent + event.content }
                  : c
              )
            );
            scrollToBottom();
            break;
          case 'chapter_complete':
            // The backend emits chapter_complete twice: once from _stream_chapter_text
            // (with the content still in streamingContent) and once from
            // stream_generate_single_chapter (with is_last/total_chapters, but
            // streamingContent already cleared). Only push a new version on the
            // first event, when streamingContent is non-empty.
            setChapters(prev =>
              prev.map(c => {
                if (c.chapter_number !== chapterNum) return c;
                if (!c.streamingContent) {
                  // Second event — content already committed; just ensure status is correct
                  return { ...c, status: 'complete' };
                }
                const newVersions = [...c.versions, c.streamingContent];
                return {
                  ...c,
                  status: 'complete',
                  streamingContent: '',
                  versions: newVersions,
                  currentVersionIdx: newVersions.length - 1,
                };
              })
            );
            if (event.is_last) {
              setStory(prev => prev ? { ...prev, status: 'completed' } : prev);
              setGenerationStatus('Story complete!');
            } else {
              setGenerationStatus('');
            }
            break;
          case 'error':
            setError(event.error);
            break;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setGenerationStatus('Generation stopped.');
        // Roll back generating state
        setChapters(prev =>
          prev.map(c =>
            c.chapter_number === chapterNum && c.status === 'generating'
              ? {
                  ...c,
                  status: c.versions.length > 0 ? 'complete' : 'pending',
                  streamingContent: '',
                  currentVersionIdx: c.versions.length > 0 ? c.versions.length - 1 : -1,
                }
              : c
          )
        );
      } else {
        setError('Generation failed. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [abort, scrollToBottom]);

  // ── Arc review handlers ────────────────────────────────────────────────────

  const handleArcChapterChange = useCallback(
    (index: number, field: 'title' | 'one_liner', value: string) =>
      setArcChapters(prev => prev.map((ch, i) => (i === index ? { ...ch, [field]: value } : ch))),
    []
  );

  const handleGenerateStory = useCallback(async () => {
    if (!story) return;
    setIsSavingArc(true);
    setError(null);
    try {
      await updateStoryArc(story.id, arcChapters);
      setChapters(arcChapters.map(makeChapterFromArc));
      setIsArcReady(false);
      await runSingleChapter(story.id, 1);
    } catch {
      setError('Failed to save story plan. Please try again.');
    } finally {
      setIsSavingArc(false);
    }
  }, [story, arcChapters, runSingleChapter]);

  const handleRegenerateArc = useCallback(() => {
    if (!story) return;
    setArcChapters([]);
    setSynopsis('');
    runArcGeneration(story.id);
  }, [story, runArcGeneration]);

  // ── Chapter action handlers ────────────────────────────────────────────────

  const handleRegenerateChapter = useCallback(() => {
    if (!story) return;
    runSingleChapter(story.id, activeChapterNum);
  }, [story, activeChapterNum, runSingleChapter]);

  const handleNextChapter = useCallback(async () => {
    if (!story) return;
    const chapter = chapters.find(c => c.chapter_number === activeChapterNum);
    if (!chapter) return;

    // If the user has selected a non-latest version, save it to DB so the next
    // chapter's continuity is based on the chosen version.
    const isLatestVersion = chapter.currentVersionIdx === chapter.versions.length - 1;
    if (!isLatestVersion && chapter.versions.length > 0) {
      try {
        await setChapterContent(story.id, activeChapterNum, chapter.versions[chapter.currentVersionIdx]);
      } catch {
        setError('Failed to save selected version. Please try again.');
        return;
      }
    }

    await runSingleChapter(story.id, activeChapterNum + 1);
  }, [story, activeChapterNum, chapters, runSingleChapter]);

  const handleSwitchVersion = useCallback((chapterNum: number, delta: number) => {
    setChapters(prev =>
      prev.map(c => {
        if (c.chapter_number !== chapterNum) return c;
        const next = Math.max(0, Math.min(c.versions.length - 1, c.currentVersionIdx + delta));
        return { ...c, currentVersionIdx: next };
      })
    );
  }, []);

  const handleAbort = useCallback(() => {
    abort();
    setIsGenerating(false);
    setIsArcGenerating(false);
  }, [abort]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeChapter = chapters.find(c => c.chapter_number === activeChapterNum);
  const totalChapters = arcChapters.length || chapters.length;
  const isLastChapter = activeChapterNum >= totalChapters;
  const allComplete = chapters.length > 0 && chapters.every(c => c.status === 'complete');

  // ── Render ─────────────────────────────────────────────────────────────────

  if (pageLoading || isInitializing) {
    return (
      <div className="long-story__page long-story__page--loading">
        <div className="long-story__loading">
          <div className="long-story__spinner" />
          <p>{isInitializing ? 'Creating story...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error && !story) {
    return (
      <div className="long-story__page long-story__page--error">
        <div className="long-story__error-message">
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="long-story__btn-back">Go Back</button>
        </div>
      </div>
    );
  }

  // ── Arc review panel ───────────────────────────────────────────────────────

  if (isArcReady && !isGenerating) {
    return (
      <div className="long-story__page">
        <div className="long-story__toolbar">
          <button className="long-story__btn-icon" onClick={() => navigate('/long-stories')} title="Back to stories">
            <FaArrowLeft />
          </button>
          <div className="long-story__toolbar-title">{story?.title || 'Long Story'}</div>
        </div>

        <div className="long-story__arc-review">
          {synopsis && (
            <div className="long-story__arc-synopsis">
              <h3 className="long-story__arc-synopsis-label">Synopsis</h3>
              <p className="long-story__arc-synopsis-text">{synopsis}</p>
            </div>
          )}

          <div className="long-story__arc-header">
            <div className="long-story__arc-header-row">
              <div>
                <h2 className="long-story__arc-title"><FaPen /> Chapter Plan</h2>
                <p className="long-story__arc-subtitle">
                  Edit any chapter title or description, then generate the story chapter by chapter — or start over with a new plan.
                </p>
              </div>
              <span className="long-story__arc-chapter-count">
                {arcChapters.length} chapter{arcChapters.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="long-story__arc-chapters">
            {arcChapters.map((ch, index) => (
              <div key={ch.chapter_number} className="long-story__arc-chapter">
                <div className="long-story__arc-chapter-num">Chapter {ch.chapter_number}</div>
                <label className="long-story__arc-field">
                  <span className="long-story__arc-field-label">Title</span>
                  <input
                    className="long-story__arc-input"
                    type="text"
                    value={ch.title}
                    onChange={e => handleArcChapterChange(index, 'title', e.target.value)}
                    placeholder="Chapter title"
                  />
                </label>
                <label className="long-story__arc-field">
                  <span className="long-story__arc-field-label">Description</span>
                  <input
                    className="long-story__arc-input long-story__arc-input--oneliner"
                    type="text"
                    value={ch.one_liner}
                    onChange={e => handleArcChapterChange(index, 'one_liner', e.target.value)}
                    placeholder="Brief description of this chapter"
                  />
                </label>
              </div>
            ))}
          </div>

          {error && (
            <div className="long-story__error-banner">
              {error}<button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          <div className="long-story__arc-actions">
            <div className="long-story__arc-action-card long-story__arc-action-card--secondary">
              <div className="long-story__arc-action-info">
                <span className="long-story__arc-action-label"><FaRotateRight /> Regenerate Plan</span>
                <span className="long-story__arc-action-desc">Ask the AI for a completely new chapter outline</span>
              </div>
              <button className="long-story__btn-secondary" onClick={handleRegenerateArc} disabled={isSavingArc}>
                Regenerate
              </button>
            </div>

            <div className="long-story__arc-action-card long-story__arc-action-card--primary">
              <div className="long-story__arc-action-info">
                <span className="long-story__arc-action-label">Generate Story</span>
                <span className="long-story__arc-action-desc">
                  Write the story one chapter at a time, starting with Chapter 1
                </span>
              </div>
              <button
                className="long-story__btn-resume long-story__btn-resume--large"
                onClick={handleGenerateStory}
                disabled={isSavingArc || arcChapters.length === 0}
              >
                {isSavingArc ? 'Starting...' : 'Begin →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Arc generating progress ────────────────────────────────────────────────

  if (isArcGenerating) {
    return (
      <div className="long-story__page">
        <div className="long-story__toolbar">
          <button className="long-story__btn-icon" onClick={() => navigate('/long-stories')} title="Back">
            <FaArrowLeft />
          </button>
          <div className="long-story__toolbar-title">{story?.title || 'Long Story'}</div>
          <div className="long-story__toolbar-actions">
            <button className="long-story__btn-stop" onClick={handleAbort}><FaStop /> Cancel</button>
          </div>
        </div>
        <div className="long-story__arc-progress">
          <div className="long-story__spinner" />
          <p className="long-story__arc-progress-status">{generationStatus}</p>
          {synopsis && (
            <div className="long-story__arc-synopsis long-story__arc-synopsis--inline">
              <h3 className="long-story__arc-synopsis-label">Synopsis</h3>
              <p className="long-story__arc-synopsis-text">{synopsis}</p>
            </div>
          )}
          {arcChapters.length > 0 && (
            <ul className="long-story__arc-preview">
              {arcChapters.map(ch => (
                <li key={ch.chapter_number} className="long-story__arc-preview-item">
                  <span className="long-story__arc-preview-num">Ch {ch.chapter_number}</span>
                  <span className="long-story__arc-preview-title">{ch.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // ── Main chapter reader ────────────────────────────────────────────────────

  // What text to display for the active chapter
  const chapterDisplayContent = (() => {
    if (!activeChapter) return '';
    if (activeChapter.status === 'generating') return activeChapter.streamingContent;
    if (activeChapter.currentVersionIdx >= 0)
      return activeChapter.versions[activeChapter.currentVersionIdx];
    return '';
  })();

  return (
    <div className="long-story__page">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="long-story__toolbar">
        <button className="long-story__btn-icon" onClick={() => navigate('/long-stories')} title="Back to stories">
          <FaArrowLeft />
        </button>
        <div className="long-story__toolbar-title">{story?.title || 'Long Story'}</div>
        <div className="long-story__toolbar-actions">
          {isGenerating && (
            <button className="long-story__btn-stop" onClick={handleAbort} title="Stop generation">
              <FaStop /> Stop
            </button>
          )}
          {story?.status === 'arc_ready' && !isArcReady && (
            <button className="long-story__btn-resume" onClick={() => setIsArcReady(true)}>
              Review Plan
            </button>
          )}
        </div>
      </div>

      <div className="long-story__body">
        {/* ── Chapter Sidebar ──────────────────────────────────────────── */}
        <nav className="long-story__sidebar">
          {synopsis && (
            <div
              className={`long-story__sidebar-item ${activeChapterNum === 0 ? 'active' : ''}`}
              onClick={() => setActiveChapterNum(0)}
            >
              <span className="long-story__chapter-icon">◈</span>
              <span className="long-story__chapter-label">Synopsis</span>
            </div>
          )}

          {chapters.map(ch => (
            <div
              key={ch.chapter_number}
              className={`long-story__sidebar-item ${activeChapterNum === ch.chapter_number ? 'active' : ''} long-story__sidebar-item--${ch.status}`}
              onClick={() => setActiveChapterNum(ch.chapter_number)}
            >
              <span className="long-story__chapter-icon">
                {ch.status === 'complete' ? '✓' : ch.status === 'generating' ? '…' : '○'}
              </span>
              <div className="long-story__chapter-info">
                <span className="long-story__chapter-num">Ch {ch.chapter_number}</span>
                <span className="long-story__chapter-title">{ch.title}</span>
              </div>
            </div>
          ))}

          {chapters.length === 0 && !isGenerating && (
            <div className="long-story__sidebar-empty"><p>No chapters yet.</p></div>
          )}
        </nav>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <main className="long-story__content" ref={contentRef}>
          {(isGenerating || generationStatus) && (
            <div className={`long-story__status-bar ${isGenerating ? 'generating' : ''}`}>
              {isGenerating && <div className="long-story__status-dot" />}
              {generationStatus}
            </div>
          )}

          {error && (
            <div className="long-story__error-banner">
              {error}<button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* Synopsis */}
          {activeChapterNum === 0 && synopsis && (
            <div className="long-story__chapter-view">
              <h2 className="long-story__chapter-heading">Synopsis</h2>
              <div className="long-story__chapter-text">{synopsis}</div>
            </div>
          )}

          {/* Chapter */}
          {activeChapterNum > 0 && activeChapter && (
            <div className="long-story__chapter-view">
              <div className="long-story__chapter-meta">
                <span className="long-story__chapter-number-label">Chapter {activeChapter.chapter_number}</span>
              </div>
              <h2 className="long-story__chapter-heading">{activeChapter.title}</h2>
              {activeChapter.one_liner && (
                <p className="long-story__chapter-one-liner">{activeChapter.one_liner}</p>
              )}

              {chapterDisplayContent ? (
                <div className="long-story__chapter-text">
                  {chapterDisplayContent}
                  {activeChapter.status === 'generating' && (
                    <span className="long-story__cursor">▌</span>
                  )}
                </div>
              ) : activeChapter.status === 'pending' ? (
                <div className="long-story__chapter-pending">
                  {isGenerating ? 'Generating...' : 'Not yet generated.'}
                </div>
              ) : null}

              {/* ── Chapter actions ──────────────────────────────────── */}
              {activeChapter.status === 'complete' && !isGenerating && (
                <div className="long-story__chapter-actions">
                  {/* Version switcher */}
                  {activeChapter.versions.length > 1 && (
                    <div className="long-story__version-switcher">
                      <button
                        className="long-story__version-btn"
                        onClick={() => handleSwitchVersion(activeChapter.chapter_number, -1)}
                        disabled={activeChapter.currentVersionIdx === 0}
                        title="Previous version"
                      >
                        <FaChevronLeft />
                      </button>
                      <span className="long-story__version-label">
                        Version {activeChapter.currentVersionIdx + 1} of {activeChapter.versions.length}
                      </span>
                      <button
                        className="long-story__version-btn"
                        onClick={() => handleSwitchVersion(activeChapter.chapter_number, 1)}
                        disabled={activeChapter.currentVersionIdx === activeChapter.versions.length - 1}
                        title="Next version"
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="long-story__chapter-btns">
                    <button
                      className="long-story__btn-chapter-action long-story__btn-chapter-action--secondary"
                      onClick={handleRegenerateChapter}
                      title="Generate another version of this chapter"
                    >
                      <FaRotateRight /> Regenerate
                    </button>
                    {!isLastChapter && (
                      <button
                        className="long-story__btn-chapter-action long-story__btn-chapter-action--primary"
                        onClick={handleNextChapter}
                      >
                        Next Chapter <FaChevronRight />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {chapters.length === 0 && !isGenerating && !synopsis && (
            <div className="long-story__empty">
              <div className="long-story__empty-icon">📖</div>
              <p>Ready to generate your story.</p>
            </div>
          )}

          {allComplete && !isGenerating && (
            <div className="long-story__complete-badge">
              Story complete — {chapters.length} chapters
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LongStoryPage;
