import os
import requests
import urllib3

# Disable SSL warnings for development
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
import json
import subprocess
import tempfile
import uuid
from django.conf import settings

# Try to load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # Manually load .env file if dotenv not available
    env_path = os.path.join(settings.BASE_DIR, '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

class MermaidService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

    def get_available_models(self):
        """Get available Gemini models"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={self.api_key}"
        try:
            response = requests.get(url, verify=False)
            response.raise_for_status()
            data = response.json()
            return [m['name'] for m in data.get('models', [])]
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch models: {e}")

    def pick_text_model(self, models):
        """Select the best text generation model"""
        # Filter out embedding models and other non-text-generation models
        text_models = [m for m in models if not any(x in m.lower() for x in [
            'embedding', 'aqa', 'imagen', 'tts', 'exp', 'thinking', 'preview', 'learnlm'
        ])]

        if not text_models:
            return None

        # Prefer stable Gemini models in order of preference
        preferred_models = [
            'models/gemini-1.5-pro',
            'models/gemini-1.5-flash',
            'models/gemini-2.5-pro',
            'models/gemini-2.5-flash',
            'models/gemini-2.0-flash'
        ]

        for preferred in preferred_models:
            if preferred in text_models:
                return preferred

        # If no preferred models, use the first available
        return text_models[0]

    def generate_mermaid_from_story(self, story_content, story_title="Story"):
        """Generate Mermaid flowchart from story content"""
        prompt = f"""
Generate a Mermaid.js flowchart diagram that represents the plot structure of this story:

Title: {story_title}
Content: {story_content}

Create a flowchart that shows:
1. The main plot points and story progression
2. Key decision points or conflicts
3. Character interactions or relationships
4. Story resolution

Use proper Mermaid.js flowchart syntax starting with 'flowchart TD' and use appropriate node shapes:
- [Text] for regular steps/events
- {{Text}} for decision points
- ((Text)) for start/end points

Return ONLY the Mermaid code without any explanation.

Example format:
flowchart TD
    A((Start)) --> B[Setup]
    B --> C{{Decision?}}
    C -->|Yes| D[Action 1]
    C -->|No| E[Action 2]
    D --> F((End))
    E --> F
"""
        return self.generate_mermaid(prompt)

    def generate_mermaid_from_description(self, description):
        """Generate Mermaid flowchart from a text description"""
        prompt = f"""
Generate a Mermaid.js flowchart diagram with the following requirements:

{description}

Use proper Mermaid.js flowchart syntax starting with 'flowchart TD' and use appropriate node shapes and arrow connections. Return ONLY the Mermaid code without any explanation.

Example format:
flowchart TD
    A[Start] --> B[Step 1]
    B --> C{{Decision?}}
    C -->|Yes| D[Option 1]
    C -->|No| E[Option 2]
"""
        return self.generate_mermaid(prompt)

    def generate_mermaid(self, prompt_text):
        """Generate Mermaid code using Gemini API"""
        # Get available models
        models = self.get_available_models()
        if not models:
            raise Exception("No models available")

        # Pick a model
        model = self.pick_text_model(models)
        if not model:
            raise Exception("No suitable text generation model found")

        # Remove the 'models/' prefix from the model name for the URL
        model_name = model.replace('models/', '')

        # Use the newer generateContent endpoint for Gemini models
        if "gemini" in model.lower():
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": prompt_text}]
                }],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 1000
                }
            }
        else:
            # Fallback to older generateText endpoint
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateText?key={self.api_key}"
            payload = {
                "prompt": {"text": prompt_text},
                "temperature": 0.2,
                "maxOutputTokens": 1000
            }

        try:
            response = requests.post(api_url, json=payload, verify=False)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise Exception(f"HTTP Error: {e}")

        data = response.json()
        try:
            if "gemini" in model.lower():
                result = data['candidates'][0]['content']['parts'][0]['text'].strip()
            else:
                result = data['candidates'][0]['content'].strip()

            # Clean up markdown code blocks if present
            if result.startswith('```mermaid'):
                result = result.replace('```mermaid\n', '').replace('\n```', '')
            elif result.startswith('```'):
                result = result.replace('```\n', '').replace('\n```', '')

            return result.strip()
        except (KeyError, IndexError):
            raise Exception("Unexpected response format from Gemini API")

    def render_svg_from_mermaid(self, mermaid_code):
        """Render Mermaid code to SVG and return the file path"""
        # Create temporary files
        temp_id = str(uuid.uuid4())
        mmd_file = f"/tmp/diagram_{temp_id}.mmd"
        svg_file = f"/tmp/diagram_{temp_id}.svg"

        # Write Mermaid code to temp file
        with open(mmd_file, "w") as f:
            f.write(mermaid_code)

        try:
            # Generate SVG using Mermaid CLI
            subprocess.run(["mmdc", "-i", mmd_file, "-o", svg_file],
                          check=True, capture_output=True)
            return svg_file
        except subprocess.CalledProcessError as e:
            raise Exception(f"Failed to generate SVG: {e}")
        except FileNotFoundError:
            raise Exception("Mermaid CLI (mmdc) not found. Please install @mermaid-js/mermaid-cli")
        finally:
            # Clean up mmd file
            if os.path.exists(mmd_file):
                os.remove(mmd_file)

    def generate_multiple_flowcharts(self, description, character_names=None):
        """Generate multiple flowcharts: one ensemble + individual character flowcharts"""
        try:
            if not character_names:
                # Extract character names from description or use defaults
                character_names = ["Character A", "Character B", "Character C"]

            flowcharts = {}

            # 1. Generate main ensemble flowchart
            ensemble_prompt = f"""
Generate a Mermaid.js flowchart that shows the main story flow and ensemble interactions:

{description}

Create a comprehensive flowchart that shows:
1. The overall plot progression
2. Key decision points that affect multiple characters
3. Major story beats and climax
4. How different characters' paths intersect
5. The resolution that ties everyone together

Focus on the BIG PICTURE story structure. Use proper Mermaid.js syntax starting with 'flowchart TD'.
Return ONLY the Mermaid code without any explanation.

Example format:
flowchart TD
    A[Story Opening] --> B[Characters Meet]
    B --> C{{Major Conflict}}
    C -->|Path 1| D[Character Actions]
    C -->|Path 2| E[Alternative Response]
    D --> F[Climax]
    E --> F
    F --> G[Resolution]
"""

            ensemble_code = self.generate_mermaid(ensemble_prompt)
            flowcharts['ensemble'] = {
                'title': 'Main Story Flow - Ensemble',
                'mermaid_code': ensemble_code,
                'description': 'Overall story structure and character interactions',
                'type': 'ensemble'
            }

            # 2. Generate individual character flowcharts
            for i, character_name in enumerate(character_names):
                character_prompt = f"""
Generate a Mermaid.js flowchart focused specifically on {character_name}'s journey in this story:

Story Context: {description}

Create a flowchart that shows:
1. {character_name}'s introduction and initial state
2. Their personal goals and motivations
3. Challenges and obstacles they face
4. Key decisions {character_name} makes
5. Their character arc and growth
6. How they contribute to the resolution

Focus ONLY on {character_name}'s personal journey and development. Use proper Mermaid.js syntax starting with 'flowchart TD'.
Return ONLY the Mermaid code without any explanation.

Example format:
flowchart TD
    A[{character_name} Introduction] --> B[Initial Goal]
    B --> C[Obstacle Appears]
    C --> D{{{character_name} Decision?}}
    D -->|Choice 1| E[Action/Growth]
    D -->|Choice 2| F[Alternative Path]
    E --> G[Character Development]
    F --> G
    G --> H[Final State]
"""

                character_code = self.generate_mermaid(character_prompt)
                flowcharts[f'character_{i+1}'] = {
                    'title': f'{character_name} - Character Journey',
                    'mermaid_code': character_code,
                    'description': f'Individual character arc and development for {character_name}',
                    'type': 'character',
                    'character_name': character_name
                }

            return {
                'success': True,
                'description': description,
                'character_names': character_names,
                'flowcharts': flowcharts,
                'total_flowcharts': len(flowcharts),
                'generation_method': 'Gemini AI Multi-Flowchart',
                'metadata': {
                    'generated_by': 'Gemini AI',
                    'flowchart_types': ['ensemble'] + [f'character_{i+1}' for i in range(len(character_names))]
                }
            }

        except Exception as e:
            raise Exception(f"Failed to generate multiple flowcharts: {e}")

    def generate_story_flowchart_data(self, story):
        """Generate complete flowchart data structure for a story"""
        try:
            # Generate Mermaid code from story content
            mermaid_code = self.generate_mermaid_from_story(
                story.content,
                story.title
            )

            # Create data structure compatible with your existing format
            data = {
                'type': 'mermaid_flowchart',
                'title': f'Story Flow: {story.title}',
                'mermaid_code': mermaid_code,
                'description': f'AI-generated flowchart visualization for "{story.title}"',
                'metadata': {
                    'generated_by': 'Gemini AI',
                    'story_id': str(story.id),
                    'story_title': story.title
                }
            }

            return data
        except Exception as e:
            raise Exception(f"Failed to generate story flowchart: {e}")