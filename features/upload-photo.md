# Feature: Upload Photo to Generate Character

**User Story:**

As a user, I want to upload a photo of a person to automatically generate a character with relevant attributes, so I can quickly create new characters based on visual inspiration.

**Acceptance Criteria:**

*   A "Create from photo..." button is available in the `CharactersTab`.
*   Clicking the button opens a modal dialog.
*   The modal allows the user to:
    *   Select an image file (e.g., JPG, PNG) from their local system.
    *   Optionally provide a name for the character.
    *   Optionally provide a description or other notes for the character.
*   Clicking "Generate Character" in the modal sends the photo and optional fields to the backend.
*   The photo should be small and not exceed 300kb in size.
*   The backend processes the photo using a multimodal AI model. (gemma3)
*   If the photo is not of a person, the backend returns an error message, which is displayed to the user in the modal.
*   If successful, the backend generates character attributes based on the photo and any provided text.
*   The newly generated character is added to the user's character list.
*   The uploaded photo is stored in the database and linked to the generated character.
*   If the character is deleted, the associated photo is also deleted from the database and storage.

**Technical Considerations:**

*   **Frontend:**
    *   Implement a new modal component for photo upload and input fields.
    *   Handle file selection and preview (optional but recommended).
    *   Make an API call to a new backend endpoint, sending the image data (e.g., as FormData) and other character details.
    *   Display success or error messages received from the backend.
*   **Backend:**
    *   Create a new API endpoint (e.g., `/api/characters/create-from-photo`).
    *   Validate the uploaded file (e.g., file type, size) - do content validation through the llm that analyzes the image, eg with a prompt "if the provided image is not a person, return 'ERROR'".
    *   Utilize a specific multimodal AI model for character generation from images instead of the user-selected model. In our case we use the "Google/Gemma3-4B" model.
    *   Use a specific prompt to retrieve a description of the image in the "character" json format
    *   Store the photo (e.g., in a designated folder or cloud storage) and save its path or reference in a new database table.
    *   Create a new character record in the database, linking it to the stored photo.
    *   Implement a mechanism to delete the photo when the corresponding character is deleted (e.g., using database triggers or a cleanup job).

**Modal Mock-up:**

```
+-----------------------------------------------------+
| Create Character from Photo                         | X |
+-----------------------------------------------------+
|                                                     |
|   +---------------------------------------------+   |
|   |            Drag and drop a photo            |   |
|   |                     or                      |   |
|   |              [Choose File]                  |   |
|   |                                             |   |
|   |      (Max file size: 5MB, JPG or PNG)       |   |
|   +---------------------------------------------+   |
|                                                     |
|   Name (Optional):                                  |
|   +---------------------------------------------+   |
|   |                                             |   |
|   +---------------------------------------------+   |
|                                                     |
|   Description/Notes (Optional):                     |
|   +---------------------------------------------+   |
|   |                                             |   |
|   |                                             |   |
|   +---------------------------------------------+   |
|                                                     |
|   [Error message area, e.g., "Please upload a photo of a person."] |
|                                                     |
|               +----------+ +-------------------+    |
|               |  Cancel  | | Generate Character|    |
|               +----------+ +-------------------+    |
+-----------------------------------------------------+
```