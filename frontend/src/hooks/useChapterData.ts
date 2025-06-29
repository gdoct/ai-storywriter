import { useState } from 'react';
import { Chapter, MultipleChapters } from '../types/chapters';

const useChapterData = (initialData: MultipleChapters) => {
  const [chapters, setChapters] = useState<Chapter[]>(initialData.chapters);
  const [isDirty, setIsDirty] = useState(false);

  const addChapter = (newChapter: Omit<Chapter, 'id'>) => {
    const chapter: Chapter = {
      ...newChapter,
      id: `temp-id-${Date.now()}`,
    };
    setChapters(prev => [...prev, chapter]);
    setIsDirty(true);
  };

  const updateChapter = (updatedChapter: Chapter) => {
    setChapters(prev => prev.map(c => c.id === updatedChapter.id ? updatedChapter : c));
    setIsDirty(true);
  };

  const deleteChapter = (chapterId: string) => {
    setChapters(prev => prev.filter(c => c.id !== chapterId));
    setIsDirty(true);
  };

  return {
    chapters,
    isDirty,
    addChapter,
    updateChapter,
    deleteChapter,
    setIsDirty
  };
};

export default useChapterData;
