import json

from data.db import get_db_connection
from data.repositories import GeneratedTextRepository, ScenarioRepository
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

scenario_bp = Blueprint('scenario', __name__)

# --- NEW DB-BASED ENDPOINTS ---

@scenario_bp.route('/api/scenario', methods=['GET'])
@jwt_required()
def get_all_scenarios():
    username = get_jwt_identity()
    # Get user from DB
    from data.repositories import UserRepository
    user = UserRepository.get_user_by_username(username)
    if not user:
        return jsonify([])
    scenarios = ScenarioRepository.get_scenarios_by_user(user['id'])
    
    # Parse each scenario's JSON data and prepare the response
    result = []
    for s in scenarios:
        try:
            scenario_data = json.loads(s['jsondata'])
            # Ensure the ID is set correctly
            scenario_data['id'] = s['id']
            # Include minimal info needed for listing
            result.append({
                'id': s['id'],
                'title': scenario_data.get('title', ''),
                'synopsis': scenario_data.get('synopsis', '')
            })
        except Exception as e:
            current_app.logger.error(f"Error parsing scenario data: {e}")
    
    return jsonify(result)

@scenario_bp.route('/api/scenario', methods=['POST'])
@jwt_required()
def create_scenario():
    username = get_jwt_identity()
    data = request.json
    from data.repositories import UserRepository
    user = UserRepository.get_user_by_username(username)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Extract data from the request
    title = data.get('title', '')
    
    # Convert the entire scenario object to JSON string for storage
    import json
    jsondata = json.dumps(data)
    
    # Create scenario
    scenario = ScenarioRepository.create_scenario(user['id'], title, jsondata)
    
    # Parse the stored JSON data back into object
    scenario_data = json.loads(scenario['jsondata'])
    
    # Return with the correct ID from the database
    scenario_data['id'] = scenario['id']
    
    return jsonify(scenario_data), 201

@scenario_bp.route('/api/scenario/<string:scenario_id>', methods=['GET'])
@jwt_required()
def get_scenario_by_id(scenario_id):
    username = get_jwt_identity()
    # Get scenario from DB
    conn = get_db_connection()
    scenario = conn.execute('SELECT * FROM scenarios WHERE id = ? AND is_deleted = 0', (scenario_id,)).fetchone()
    conn.close()
    
    if not scenario:
        return jsonify({'error': 'Scenario not found'}), 404
        
    try:
        # Parse the stored JSON data back into object
        scenario_data = json.loads(scenario['jsondata'])
        
        # Ensure the ID is set correctly
        scenario_data['id'] = scenario['id']
        
        return jsonify(scenario_data)
    except Exception as e:
        current_app.logger.error(f"Error parsing scenario data: {e}")
        return jsonify({'error': 'Invalid scenario data'}), 500

@scenario_bp.route('/api/scenario/<string:scenario_id>', methods=['PUT'])
@jwt_required()
def update_scenario(scenario_id):
    username = get_jwt_identity()
    data = request.json
    from data.repositories import UserRepository
    user = UserRepository.get_user_by_username(username)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Store the complete scenario object as JSON
    jsondata = json.dumps(data)
    title = data.get('title', '')
    
    # Update the scenario in the database
    ScenarioRepository.update_scenario(scenario_id, title, jsondata)
    
    # Return the updated scenario data with the correct ID
    data['id'] = scenario_id
    return jsonify(data)

@scenario_bp.route('/api/scenario/<string:scenario_id>', methods=['DELETE'])
@jwt_required()
def delete_scenario(scenario_id):
    username = get_jwt_identity()
    from data.repositories import UserRepository
    user = UserRepository.get_user_by_username(username)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Delete all stories associated with this scenario first
    GeneratedTextRepository.delete_stories_by_scenario(scenario_id)
    
    # Then delete the scenario
    ScenarioRepository.delete_scenario(scenario_id)
    return jsonify({'success': True})

# --- STORY ENDPOINTS ---

@scenario_bp.route('/api/story/<string:scenario_id>', methods=['GET'])
@jwt_required()
def get_stories(scenario_id):
    """Get all stories for a scenario with preview text only (first 50 words) to save bandwidth"""
    stories = GeneratedTextRepository.get_stories_by_scenario(scenario_id)
    result = []
    for s in stories:
        # Extract first 50 words from the story text
        words = s['text'].split()
        preview_words = words[:50]
        preview_text = ' '.join(preview_words)
        
        # Add ellipsis if there are more than 50 words
        if len(words) > 50:
            preview_text += '...'
        
        result.append({
            'id': s['id'],
            'text': preview_text,
            'full_text_available': len(words) > 50,
            'created_at': s['created_at']
        })
    
    return jsonify(result)

@scenario_bp.route('/api/story/single/<int:story_id>', methods=['GET'])
@jwt_required()
def get_single_story(story_id):
    """Get a single story by ID - optimized endpoint for Stories page (excludes scenario data)"""
    try:
        story = GeneratedTextRepository.get_story_by_id(story_id)
        if not story:
            return jsonify({'error': 'Story not found'}), 404
        
        return jsonify({
            'id': story['id'],
            'text': story['text'],
            'created_at': story['created_at'],
            'scenario_id': story['scenario_id']
            # Note: deliberately excluding scenario_json to reduce payload size
        })
    except Exception as e:
        current_app.logger.error(f"Error getting single story {story_id}: {e}")
        return jsonify({'error': str(e)}), 500

@scenario_bp.route('/api/story/<string:scenario_id>', methods=['POST'])
@jwt_required()
def save_story(scenario_id):
    data = request.json
    content = data.get('content')
    scenario_json = data.get('scenario')  # Get the scenario JSON from the request
    
    if not content:
        return jsonify({'error': 'Content is required'}), 400
    
    # Convert scenario object to JSON string if it's provided
    scenario_json_str = None
    if scenario_json:
        scenario_json_str = json.dumps(scenario_json)
    
    story = GeneratedTextRepository.create_story(scenario_id, content, scenario_json_str)
    return jsonify({
        'id': story['id'],
        'content': story['text'],
        'timestamp': story['created_at']
    }), 201

@scenario_bp.route('/api/story/delete/<int:story_id>', methods=['DELETE'])
@jwt_required()
def delete_story(story_id):
    try:
        GeneratedTextRepository.delete_story(story_id)
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scenario_bp.route('/api/story/continue/<int:story_id>', methods=['POST'])
@jwt_required()
def create_continuation_scenario(story_id):
    """Create a new scenario for continuing a story"""
    try:
        username = get_jwt_identity()
        data = request.json
        original_scenario_id = data.get('originalScenarioId')
        
        if not original_scenario_id:
            return jsonify({'error': 'Original scenario ID is required'}), 400
        
        # Get user from DB
        from data.repositories import UserRepository
        user = UserRepository.get_user_by_username(username)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get the original story
        original_story = GeneratedTextRepository.get_story_by_id(story_id)
        if not original_story:
            return jsonify({'error': 'Original story not found'}), 404
        
        # Get the original scenario 
        conn = get_db_connection()
        original_scenario = conn.execute('SELECT * FROM scenarios WHERE id = ? AND is_deleted = 0', (original_scenario_id,)).fetchone()
        conn.close()
        
        if not original_scenario:
            return jsonify({'error': 'Original scenario not found'}), 404
        
        # Parse the original scenario data
        original_scenario_data = json.loads(original_scenario['jsondata'])
        
        # Create continuation scenario based on original
        continuation_scenario = original_scenario_data.copy()
        
        # Update metadata for continuation
        import uuid
        from datetime import datetime
        continuation_scenario['id'] = str(uuid.uuid4())
        continuation_scenario['title'] = f"{original_scenario_data.get('title', 'Untitled')} - Chapter 2"
        continuation_scenario['synopsis'] = f"Continuation of: {original_scenario_data.get('synopsis', '')}"
        continuation_scenario['createdAt'] = datetime.utcnow().isoformat()
        continuation_scenario['updatedAt'] = datetime.utcnow().isoformat()
        
        # Add the previous story content to the backstory or notes
        previous_story_text = original_story['text']
        continuation_backstory = f"""Previous Chapter:

{previous_story_text}

---

Continue the story from where it left off, building on the events and character development from the previous chapter."""
        
        continuation_scenario['backstory'] = continuation_backstory
        
        # Store the continuation scenario in the database
        jsondata = json.dumps(continuation_scenario)
        title = continuation_scenario.get('title', '')
        
        new_scenario = ScenarioRepository.create_scenario(user['id'], title, jsondata)
        
        # Return the continuation scenario with the correct ID
        continuation_scenario['id'] = new_scenario['id']
        
        return jsonify(continuation_scenario), 201
        
    except Exception as e:
        current_app.logger.error(f"Error creating continuation scenario: {e}")
        return jsonify({'error': str(e)}), 500
