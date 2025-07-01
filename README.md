# StoryWriter

StoryWriter is a web application that allows users to create, edit, and manage scenarios, which can then be sent to an AI to generate engaging stories. The app is designed to streamline the creative process, making it easy to craft story prompts and receive AI-generated narratives in return. The application allows users to refine their scenarios and characters and see how different inputs affect the generated content.

The application connects to AI services to generate stories based on user-defined scenarios. Currently the application only supports OpenAI compatible APIs without authentication or api keys, such as LM Studio or Ollama. 

The application is built with a modern tech stack, featuring a React frontend and a Flask backend.
The frontend is developed using React and TypeScript. 
The backend is built with Python and Flask, offering a REST API for handling requests and managing data.

## Screenshot
![image](https://github.com/user-attachments/assets/542c2645-696a-47ca-a7b5-c5ddfe8622f6)


## Features
- **Scenario Creation & Editing:** Build detailed scenarios with a user-friendly interface.
- **AI Story Generation:** Send your scenarios to an AI model and receive unique stories based on your input.
- **Chat with AI about your scenario**
- **AI Scenario Generation:** Generate or refine your scenarios using AI models, allowing for creative and unexpected story prompts.
- **Doesn't strictly require local AI:** While it can connect to local AI models, you can preview the prompts it generates and try them on other chatbots or AI services.
- **Story Preview:** View generated stories in a clean, readable format.
- **Story Versioning:** Keep track of multiple versions of your stories.
- **Copy scenario parts:** Easily copy characters, backstories or story arcs between scenarios.
- **User Authentication:** Each user has their own set of scenarios.
- **Modern UI:** Responsive frontend built with React and TypeScript.
- **REST API Backend:** Python Flask backend for robust and scalable API endpoints.

## Project Structure
- `frontend/` — React/TypeScript frontend application
- `backend/` — Python/Flask backend API

## Prerequisites
- Node.js (for frontend)
- Python 3.10+ (for backend)
- pip (Python package manager)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gdoct/ai-storywriter
   cd storywriter
   ```
2. **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3. **Activate the virtual environment:**
    
    On Windows:
    ```bash
    venv\Scripts\activate
    ```
    
    On macOS/Linux:
    ```bash
    source venv/bin/activate
    ```

Once the virtual environment is activated, you'll see `(venv)` in your terminal prompt.

4. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

5. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## Running the Application

1. **Start the backend server:**
   ```bash
   ./start-backend.sh
   ```
   The backend will run on the default Flask port (usually 5000).

2. **Start the frontend development server:**
   ```bash
   ./start-frontend.sh
   ```
   The frontend will run on the default React port (usually 3000).

3. **Access the app:**
   Open your browser and go to [http://localhost:3000](http://localhost:3000)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

