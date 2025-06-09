import json
import os
import uuid
from datetime import datetime

from db import get_db_connection
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from repositories import GeneratedTextRepository, ScenarioRepository

scenario_bp = Blueprint('scenario', __name__)

# --- NEW DB-BASED ENDPOINTS ---

@scenario_bp.route('/api/scenario', methods=['GET'])
@jwt_required()
def get_all_scenarios():
    username = get_jwt_identity()
    # Get user from DB
    from repositories import UserRepository
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
    from repositories import UserRepository
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
    from repositories import UserRepository
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
    from repositories import UserRepository
    user = UserRepository.get_user_by_username(username)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    ScenarioRepository.delete_scenario(scenario_id)
    return jsonify({'success': True})

# --- STORY ENDPOINTS ---

@scenario_bp.route('/api/story/<string:scenario_id>', methods=['GET'])
@jwt_required()
def get_stories(scenario_id):
    print(f"Fetching stories for scenario ID: {scenario_id}")
    stories = GeneratedTextRepository.get_stories_by_scenario(scenario_id)
    result = [
        {
            'id': s['id'],
            'text': s['text'],
            'created_at': s['created_at']
        } for s in stories
    ]
    print(f"Found {len(result)} stories for scenario {scenario_id}")
    return jsonify(result)

@scenario_bp.route('/api/story/<string:scenario_id>/list', methods=['GET'])
@jwt_required()
def get_story_list(scenario_id):
    try:
        stories = GeneratedTextRepository.get_stories_by_scenario(scenario_id)
        if not stories:
            return jsonify([])
            
        result = []
        for s in stories:
            created_at = s['created_at']
            # Format the date for display
            formatted_date = created_at  # You may want to format this better
            result.append({
                'timestamp': created_at,
                'formattedDate': formatted_date
            })
            
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error getting story list: {e}")
        return jsonify({'error': str(e)}), 500

@scenario_bp.route('/api/story/<string:scenario_id>', methods=['POST'])
@jwt_required()
def save_story(scenario_id):
    data = request.json
    content = data.get('content')
    if not content:
        return jsonify({'error': 'Content is required'}), 400
    story = GeneratedTextRepository.create_story(scenario_id, content)
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
