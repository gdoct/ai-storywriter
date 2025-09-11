# wizard component

A wizard component is a large modal that will be shown when a user needs to complete a multi-step process. The wizard component will guide the user through the process by breaking it down into smaller, more manageable steps.

## Usage

To use the wizard component, you will need to import it into your project and include it in your component tree. The wizard component will take care of managing the state of the multi-step process and providing a user-friendly interface for navigating between steps.

## Props

The wizard component will accept the following props:

- `steps`: An array of objects representing the steps in the wizard. Each step object should have a `title` and a `content` property.
- `onClose`: A callback function that will be called when the wizard is closed.
- `onComplete`: A callback function that will be called when the wizard is completed.
- `allowSkip`: A boolean that determines if the user can skip steps in the wizard.

The wizard should use the same design tokens and styling as the other components in the styling library

The first page in the wizard should have a "next" button. All other pages should have a "previous" button. The last page should have a "finish" button. If 'allowSkip' is set, the finish button is always visible
## Example

Here is an example of how to use the wizard component:

```jsx
import { Wizard } from 'your-design-system';

const steps = [
  {
    title: 'Step 1',
    content: <Step1Content />,
  },
  {
    title: 'Step 2',
    content: <Step2Content />,
  },
  {
    title: 'Step 3',
    content: <Step3Content />,
  },
];

const MyComponent = () => {
  const handleClose = () => {
    // Handle wizard close
  };

  const handleComplete = () => {
    // Handle wizard complete
  };

  return (
    <Wizard
      steps={steps}
      onClose={handleClose}
      onComplete={handleComplete}
    />
  );
};
```