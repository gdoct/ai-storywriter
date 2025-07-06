# project description
this is a storybook for the npm library '@drdata/ai-styles'. 
It is built with typescript and uses vite for bundling.
The npm library for the storybook is linked directly from the folder `../lib` to the folder `./node_modules/@drdata/ai-styles`.
the npm library contains its full source code, including the components, types, and styles.
The storybook is used to document the components and their usage, and to test the components in isolation.
the original library components source can be found here `/home/guido/react/docomo/lib/src/components`

# When creating or editing stories:
* Each component should have its own story. 
* A component in the library in folder ./node_modules/@drdata/ai-styles/src/components/CustomComponent should have its story in /src/stories/CustomComponent.stories.tsx
* If stories are missing, they should be added to the file `src/stories/missing_stories.md`.
* When creating a new story, look at the existing stories (for instance the AiTextBox stories) for examples.

* If a story doesn't match the component interface, assume there was an update in the library and fix it.

## build and test instructions
* to run the storybook in dev mode use the following command: (although the user is probably already running it)
`npm run storybook`

* to build the storybook use the following command:
`npm run build-storybook`

* to verify type check use the command:
`npm run typecheck`