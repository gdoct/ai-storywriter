import React, { createContext, ReactNode, useContext, useState } from 'react';

interface SceneHoverContextType {
  hoveredSceneId: string | null;
  setHoveredSceneId: (id: string | null) => void;
}

const SceneHoverContext = createContext<SceneHoverContextType>({
  hoveredSceneId: null,
  setHoveredSceneId: () => {}
});

// eslint-disable-next-line react-refresh/only-export-components
export const useSceneHover = () => useContext(SceneHoverContext);

export const SceneHoverProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null);
  
  return (
    <SceneHoverContext.Provider value={{ hoveredSceneId, setHoveredSceneId }}>
      {children}
    </SceneHoverContext.Provider>
  );
};