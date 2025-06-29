import React, { useState } from 'react';
import { Chapter } from '../../../../types/chapters';

interface ChapterFormProps {
  onSave: (chapter: Omit<Chapter, 'id'>) => void;
  onClose: () => void;
  chapter?: Chapter;
}

const ChapterForm: React.FC<ChapterFormProps> = ({ onSave, onClose, chapter }) => {
  const [title, setTitle] = useState(chapter?.title || '');
  const [description, setDescription] = useState(chapter?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Title is required');
      return;
    }

    const chapterData: Omit<Chapter, 'id'> = {
      title,
      description,
      number: chapter?.number || 0,
      status: chapter?.status || 'planned',
      wordCountTarget: chapter?.wordCountTarget || 1500,
      generatedVersions: chapter?.generatedVersions || [],
      selectedVersionId: chapter?.selectedVersionId || null,
      customContent: chapter?.customContent || '',
      synopsis: chapter?.synopsis || { shortSummary: '', detailedSummary: '', keyEvents: [], characterDevelopments: [] },
      outline: chapter?.outline || null,
      objectives: chapter?.objectives || null,
      plotPoints: chapter?.plotPoints || null,
      characterArcs: chapter?.characterArcs || null,
      linkedEvents: chapter?.linkedEvents || [],
      linkedCharacters: chapter?.linkedCharacters || [],
      linkedLocations: chapter?.linkedLocations || [],
      linkedThemes: chapter?.linkedThemes || [],
    };

    onSave(chapterData);
    onClose();
  };

  return (
    <div className="modal-content">
      <h2>{chapter ? 'Edit Chapter' : 'Add New Chapter'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit">Save</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default ChapterForm;
