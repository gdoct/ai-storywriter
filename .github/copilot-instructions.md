# main solution settings
# This file is used to configure the behavior of GitHub Copilot in this repository.
# Copilot will use this file to understand how to assist you with code suggestions.

the app has two main projects: frontend and backend.
the frontend (react/typescript) is in the folder "[root]/frontend" and is started by the script "[root]/start-frontend.sh" (in the root of the solution)
# frontend
the frontend uses the following technologies:
- React: a JavaScript library for building user interfaces
- TypeScript: a typed superset of JavaScript that compiles to plain JavaScript

The user is running both the frontend and the backend with hot reload,so changes are immediately applied to the running application.
if the frontend or backend need to be started, ask the user to do it.

compile the frontend and check for compile errors with the following command:
```bash
cd <root>/frontend
npm run typecheck  
```
# backend
the backend (python/flask) is in the folder "[root]/backend" and is started by the script "[root]/start-backend.sh"



# project layout
/
frontend/ - contains the frontend project
  - src/ - contains the source code of the frontend
  - public/ - contains the public files of the frontend
  - package.json - contains the dependencies and scripts of the frontend
  - tsconfig.json - contains the TypeScript configuration of the frontend
backend/ - contains the backend project
    - app.py: - contains the main application code of the backend
    - requirements.txt - contains the dependencies of the backend
    - storywriter.db: - contains the sqlite database of the backend
start-frontend.sh - script to start the frontend
start-backend.sh - script to start the backend