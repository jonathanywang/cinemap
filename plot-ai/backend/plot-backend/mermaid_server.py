import os
import requests
import json
import subprocess
import sys
import tempfile
import uuid
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import threading

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

# -----------------------------
# Gemini API Functions
# -----------------------------
def get_available_models():
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    try:
        r = requests.get(url)
        r.raise_for_status()
    except requests.exceptions.RequestException as e:
        print("Failed to fetch models:", e)
        return []

    data = r.json()
    models = [m['name'] for m in data.get('models', [])]
    return models

def pick_text_model(models):
    # Filter out embedding models and other non-text-generation models
    text_models = [m for m in models if not any(x in m.lower() for x in ['embedding', 'aqa', 'imagen', 'tts', 'exp', 'thinking', 'preview', 'learnlm'])]

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

def generate_mermaid(model: str, prompt_text: str):
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
                "maxOutputTokens": 1000
            }
        }
    else:
        # Fallback to older generateText endpoint
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateText?key={API_KEY}"
        payload = {
            "prompt": {"text": prompt_text},
            "temperature": 0.2,
            "maxOutputTokens": 1000
        }

    try:
        response = requests.post(api_url, json=payload)
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

def render_svg_from_mermaid(mermaid_code: str) -> str:
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
        subprocess.run(["mmdc", "-i", mmd_file, "-o", svg_file], check=True, capture_output=True)
        return svg_file
    except subprocess.CalledProcessError as e:
        raise Exception(f"Failed to generate SVG: {e}")
    finally:
        # Clean up mmd file
        if os.path.exists(mmd_file):
            os.remove(mmd_file)

# -----------------------------
# HTTP Server Handler
# -----------------------------
class MermaidHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(self.get_html_page().encode())
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'healthy', 'service': 'Mermaid Generator'}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/api/generate':
            self.handle_generate()
        elif self.path == '/api/generate-svg':
            self.handle_generate_svg()
        else:
            self.send_response(404)
            self.end_headers()

    def get_html_page(self):
        return '''
<!DOCTYPE html>
<html>
<head>
    <title>Mermaid Flowchart Generator</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #555;
        }
        textarea {
            width: 100%;
            height: 150px;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            resize: vertical;
        }
        button {
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
        }
        button:hover {
            background-color: #0056b3;
        }
        button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        .result {
            margin-top: 30px;
            padding: 20px;
            border: 2px solid #28a745;
            border-radius: 5px;
            background-color: #f8f9fa;
        }
        .error {
            margin-top: 30px;
            padding: 20px;
            border: 2px solid #dc3545;
            border-radius: 5px;
            background-color: #f8d7da;
            color: #721c24;
        }
        .loading {
            color: #007bff;
            font-style: italic;
        }
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
        }
        .download-link {
            display: inline-block;
            margin-top: 10px;
            color: #007bff;
            text-decoration: none;
        }
        .download-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Mermaid Flowchart Generator</h1>

        <div class="form-group">
            <label for="description">Describe your flowchart:</label>
            <textarea id="description" placeholder="Example: Create a flowchart for user registration process with email verification...">Create a flowchart for a user login process with these steps:
1. Start with 'Visit Login Page'
2. 'Enter Credentials'
3. Decision point 'Credentials Valid?'
4. If yes: go to 'Dashboard' then 'Logout'
5. If no: go to 'Show Error' and loop back to 'Enter Credentials'</textarea>
        </div>

        <button onclick="generateFlowchart()">Generate Flowchart</button>
        <button onclick="generateAndDownload()">Generate & Download SVG</button>

        <div id="result"></div>
    </div>

    <script>
        async function generateFlowchart() {
            const description = document.getElementById('description').value;
            const resultDiv = document.getElementById('result');

            if (!description.trim()) {
                resultDiv.innerHTML = '<div class="error">Please enter a description for your flowchart.</div>';
                return;
            }

            resultDiv.innerHTML = '<div class="loading">Generating flowchart...</div>';

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        description: description
                    })
                });

                const data = await response.json();

                if (data.success) {
                    resultDiv.innerHTML = `
                        <div class="result">
                            <h3>Generated Mermaid Code:</h3>
                            <pre>${data.mermaid_code}</pre>
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `<div class="error">Error: ${data.error}</div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            }
        }

        async function generateAndDownload() {
            const description = document.getElementById('description').value;
            const resultDiv = document.getElementById('result');

            if (!description.trim()) {
                resultDiv.innerHTML = '<div class="error">Please enter a description for your flowchart.</div>';
                return;
            }

            resultDiv.innerHTML = '<div class="loading">Generating flowchart and SVG...</div>';

            try {
                const response = await fetch('/api/generate-svg', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        description: description
                    })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'flowchart.svg';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    resultDiv.innerHTML = '<div class="result">SVG downloaded successfully!</div>';
                } else {
                    const data = await response.json();
                    resultDiv.innerHTML = `<div class="error">Error: ${data.error}</div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            }
        }

        // Allow Ctrl+Enter to generate
        document.getElementById('description').addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                generateFlowchart();
            }
        });
    </script>
</body>
</html>
        '''

    def handle_generate(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            description = data.get('description', '')

            if not description:
                self.send_json_response({'success': False, 'error': 'Description is required'})
                return

            # Get available models
            models = get_available_models()
            if not models:
                self.send_json_response({'success': False, 'error': 'No models available'})
                return

            # Pick a model
            model = pick_text_model(models)
            if not model:
                self.send_json_response({'success': False, 'error': 'No suitable text generation model found'})
                return

            # Create enhanced prompt
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

            # Generate Mermaid code
            mermaid_code = generate_mermaid(model, prompt)

            self.send_json_response({
                'success': True,
                'mermaid_code': mermaid_code,
                'model_used': model
            })

        except Exception as e:
            self.send_json_response({'success': False, 'error': str(e)})

    def handle_generate_svg(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            description = data.get('description', '')

            if not description:
                self.send_json_response({'success': False, 'error': 'Description is required'})
                return

            # Get available models
            models = get_available_models()
            if not models:
                self.send_json_response({'success': False, 'error': 'No models available'})
                return

            # Pick a model
            model = pick_text_model(models)
            if not model:
                self.send_json_response({'success': False, 'error': 'No suitable text generation model found'})
                return

            # Create enhanced prompt
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

            # Generate Mermaid code
            mermaid_code = generate_mermaid(model, prompt)

            # Render to SVG
            svg_file = render_svg_from_mermaid(mermaid_code)

            # Send SVG file
            self.send_file_response(svg_file, 'flowchart.svg', 'image/svg+xml')

        except Exception as e:
            self.send_json_response({'success': False, 'error': str(e)})

    def send_json_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def send_file_response(self, file_path, filename, content_type):
        try:
            with open(file_path, 'rb') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content)

            # Clean up temp file
            os.remove(file_path)
        except Exception as e:
            self.send_json_response({'success': False, 'error': f'Failed to send file: {str(e)}'})

if __name__ == '__main__':
    print("Starting Mermaid Flowchart Generator Server...")
    print("Access the web interface at: http://localhost:8000")
    print("API endpoints:")
    print("  POST /api/generate - Generate Mermaid code")
    print("  POST /api/generate-svg - Generate and download SVG")
    print("  GET /health - Health check")

    server = HTTPServer(('0.0.0.0', 8000), MermaidHandler)
    print("Server running on port 8000...")
    server.serve_forever()