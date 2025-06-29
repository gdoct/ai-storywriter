import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Chapter, MultipleChapters } from '../../../../../types/chapters';

const useChapterData = (initialData: MultipleChapters) => {
  const [chapters, setChapters] = useState<Chapter[]>(initialData.chapters);

  const addChapter = (title: string, description: string) => {
    const newChapter: Chapter = {
      id: uuidv4(),
      title,
      description,
      number: chapters.length + 1,
      status: 'planned',
      wordCountTarget: 3000,
      generatedVersions: [],
      selectedVersionId: null,
      customContent: '',
      synopsis: {
        shortSummary: '',
        detailedSummary: '',
        keyEvents: [],
        characterDevelopments: [],
      },
      outline: {},
      objectives: {},
      plotPoints: {},
      characterArcs: {},
      linkedEvents: [],
      linkedCharacters: [],
      linkedLocations: [],
      linkedThemes: [],
    };
    setChapters([...chapters, newChapter]);
  };

  const updateChapter = (updatedChapter: Chapter) => {
    setChapters(chapters.map(ch => ch.id === updatedChapter.id ? updatedChapter : ch));
  };

  const deleteChapter = (chapterId: string) => {
    setChapters(chapters.filter(ch => ch.id !== chapterId));
  };

  return {
    chapters,
    addChapter,
    updateChapter,
    deleteChapter,
  };
};

export default useChapterData;
