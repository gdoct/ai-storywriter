import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import './Label.css';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Label text or content */
  children: React.ReactNode;
  /** Optional for associating with a form field */
  htmlFor?: string;
  /** Additional CSS class name */
  className?: string;
  size?: 'sm' | 'm' | 'l' | 'xl';

}

export const Label: React.FC<LabelProps> = ({ children, htmlFor, className = '',
  size = 'm', ...props }) => {
  const { resolvedTheme } = useTheme();

  return (
    <label
      htmlFor={htmlFor}
      className={["ai-label", `ai-label--${size}`, className].filter(Boolean).join(" ")}
      data-theme={resolvedTheme}
      {...props}
    >
      {children}
    </label>
  );
};

export default Label;
