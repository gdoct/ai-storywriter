import React from 'react';

// Utility function to safely render icons
export const renderIcon = (IconComponent: any, props?: any) => {
  const Icon = IconComponent as React.ComponentType<any>;
  return <Icon {...props} />;
};
