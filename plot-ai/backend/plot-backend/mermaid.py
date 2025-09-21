import os
import requests
import json
import subprocess
import sys


# Try to load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # Manually load .env file if dotenv not available
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

# -----------------------------
# Config
# -----------------------------
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("Please set your GEMINI_API_KEY environment variable")

# Files
MERMAID_FILE = "diagram.mmd"
SVG_FILE = "diagram.svg"

# -----------------------------
# Get available models
# -----------------------------
def get_available_models():
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    try:
        r = requests.get(url)
        r.raise_for_status()
    except requests.exceptions.RequestException as e:
        print("Failed to fetch models:", e)
        sys.exit(1)

    data = r.json()
    models = [m['name'] for m in data.get('models', [])]
    if not models:
        raise ValueError("No models found for your API key.")
    return models

# -----------------------------
# Pick a text-generation model
# -----------------------------
def pick_text_model(models):
    # Filter out embedding models and other non-text-generation models
    text_models = [m for m in models if not any(x in m.lower() for x in ['embedding', 'aqa', 'imagen', 'tts', 'exp', 'thinking', 'preview', 'learnlm'])]

    if not text_models:
        raise ValueError("No text-generation models available for this API key.")

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

# -----------------------------
# Generate Mermaid diagram
# -----------------------------
def generate_mermaid(model: str, prompt_text: str) -> str:
    # Remove the 'models/' prefix from the model name for the URL
    model_name = model.replace('models/', '')

    # Use the newer generateContent endpoint for Gemini models
    if "gemini" in model.lower():
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={API_KEY}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt_text}]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 500
            }
        }
    else:
        # Fallback to older generateText endpoint
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateText?key={API_KEY}"
        payload = {
            "prompt": {"text": prompt_text},
            "temperature": 0.2,
            "maxOutputTokens": 500
        }

    try:
        response = requests.post(api_url, json=payload)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print("HTTP Error:", e)
        print("Response content:", getattr(e.response, "text", None))
        sys.exit(1)

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
        raise ValueError("Unexpected response format:\n" + json.dumps(data, indent=2))

# -----------------------------
# Save Mermaid code to file
# -----------------------------
def save_mermaid_to_file(code: str, filename: str = MERMAID_FILE):
    with open(filename, "w") as f:
        f.write(code)
    print(f"Mermaid diagram saved to {filename}")

# -----------------------------
# Render SVG using Mermaid CLI
# -----------------------------
def render_svg(mmd_file: str = MERMAID_FILE, svg_file: str = SVG_FILE):
    try:
        subprocess.run(["mmdc", "-i", mmd_file, "-o", svg_file], check=True)
        print(f"SVG diagram generated: {svg_file}")
    except subprocess.CalledProcessError as e:
        print("Failed to generate SVG:", e)

# -----------------------------
# Main
# -----------------------------
if __name__ == "__main__":
    models = get_available_models()
    print("Available models:", models)

    model = pick_text_model(models)
    print("Using model:", model)

    description = """
Generate a Mermaid.js flowchart diagram with the following requirements:

Create a flowchart for a movie plot with these steps:
1. Start with 'Opening Scene'
2. 'Introduce Main Character'
3. Decision point 'Conflict Arises?'
4. If yes: go to 'Character Faces Challenge' then 'Climactic Confrontation' then 'Resolution'
5. If no: go to 'Character's Routine Life' then loop back to 'Conflict Arises?'
6. End with 'Closing Scene'

Use proper Mermaid.js flowchart syntax starting with 'flowchart TD' and use appropriate node shapes and arrow connections. Return ONLY the Mermaid code without any explanation.

Example format:
flowchart TD
    A[Start] --> B[Step 1]
    B --> C{Decision?}
    C -->|Yes| D[Option 1]
    C -->|No| E[Option 2]
"""

    mermaid = generate_mermaid(model, description)
    print("\nGenerated Mermaid Diagram:\n")
    print(mermaid)

    save_mermaid_to_file(mermaid)
    render_svg()
