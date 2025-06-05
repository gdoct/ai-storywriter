# feature: store all data in SQLite database

Description: |
  This feature allows the application to store all data in a SQLite database, providing a structured and persistent way to manage data.
Do not normalize data. 
  The database will be used to store scenarios, users and generated text.

  table layout
    - `users`: Stores user metadata
        - `id`: Primary key
        - `username`: Unique username for the user
        - `email`: Email address of the user
        - `is_deleted`: Boolean flag indicating if the user is deleted
        - `created_at`: Timestamp of account creation
    - `scenarios`: Stores scenario metadata
        - `id`: Primary key
        - `user_id`: Foreign key referencing `users.id`
        - `title`: Title of the scenario
        - `jsondata`: JSON representation of the scenario
        - `is_deleted`: Boolean flag indicating if the scenario is deleted
        - `created_at`: Timestamp of when the scenario was created
    - `stories`: Stores generated text stories
        - `id`: Primary key
        - `scenario_id`: Foreign key referencing `scenarios.id`
        - `text`: The generated text content
        - `created_at`: Timestamp of when the text was generated
    
    The application should use repositories to retrieve data and isolate the database logic from the rest of the application logic.

## Key Features
1. **SQLite Database**: All data is stored in a SQLite database, providing a lightweight and efficient storage solution. Do not use SQlAlchemy or other ORM tools.
2. **User Management**: Users can be created, updated, and deleted, with their data stored in the `users` table. on login, check if the user exists. if not, create the user automatically. 
3. **Scenario Management**: Scenarios can be created, updated, and deleted, with their metadata stored in the `scenarios` table.
4. **Generated Text Storage**: Generated stories are stored in the `stories` table, allowing for easy retrieval and management of generated content.

## Migration
Do not implement any migration scripts for existing data. The application will start with a fresh database.

## implementation
1. **Database Initialization**: Create a SQLite database file if it does not exist, and initialize the tables as described above.
2. **Repository Pattern**: Implement repositories for `UserRepository`, `ScenarioRepository`, and `GeneratedTextRepository` to handle database operations.
3. **API Endpoints**: Update the API endpoints to interact with the new database structure, ensuring that all data operations are performed through the repositories.
   - auth_controller.py: Handle user authentication and creation
   - scenario_controller.py: Manage scenarios and their metadata
   - story_controller.py: Provide endpoints for managing user generated stories.

## frontend changes
1. "save story" functionality in the ReadingArea should call the new endpoint
2. the ReadingArea should have a dropdown with all generated stories for a scenario, retrieved through the new api endpoint
