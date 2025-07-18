this is a react / typescript / python project.
the goal is to provide ai-assisted scenario writing, and ai-generated stories of those scenarios.
the app has five main areas
* "marketing": anonymous / marketing for not logged in users, user registration and login
* "dashboard": dashboard, credits management, and settings for logged in users
* "scenario writer": scenario writer and ai story generation for logged in users
* "marketplace": marketplace to exchange stories and scenarios
* "admin": admin area for site config, user admin and moderation

## frontend
the frontend project is in folder `/frontend`
the frontend uses react and typescript.
the frontend uses vite and npm for package management.
the frontend uses the components from the style library in folder `/style-library`, which is the design system for storywriter. 
## backend
the backend project is in `/backend`
the backend uses python and flask
the backend is a REST API that serves data to the frontend.
## style library
this library is in the folder `/style-library/lib` and is internally named `@drdata/ai-styles`
the style library is a collection of react components that are used in the frontend.
the style library has a storybook in `/style-library/storybook` that can be used to test the components.
the style library uses css modules for styling.

assume the user is running the dev server for both the frontend and the backend. the user will notice errors and provide feedback.

do not hesitate to make changes to the style library, it is developed hand in hand with the frontend
but ask the user to restart the frontend dev server after building the style library.