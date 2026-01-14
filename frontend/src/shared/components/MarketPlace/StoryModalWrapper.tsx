import React from 'react';
import StoryModal from '@members/components/Story/StoryModal';

interface StoryTooltipProps {
  storyId: number | null;
  showTooltip: boolean;
  handleCloseTooltip: () => void;
}

const StoryTooltip: React.FC<StoryTooltipProps> = ({ storyId, showTooltip, handleCloseTooltip }) => {
  return (
    <StoryModal
      storyId={storyId}
      show={showTooltip}
      onClose={handleCloseTooltip}
    />
  );
};

export default StoryTooltip;
