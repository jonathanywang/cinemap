from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
import json

def mermaid_demo(request):
    """
    Render a simple web interface for testing Mermaid generation
    """
    html_content = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mermaid Flowchart Generator - Django Demo</title>
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
            height: 120px;
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
            margin-bottom: 10px;
        }
        button:hover {
            background-color: #0056b3;
        }
        button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        button.secondary {
            background-color: #28a745;
        }
        button.secondary:hover {
            background-color: #218838;
        }
        button.danger {
            background-color: #dc3545;
        }
        button.danger:hover {
            background-color: #c82333;
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
            border: 1px solid #ddd;
        }
        .example-prompts {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .example-prompts h3 {
            margin-top: 0;
            color: #495057;
        }
        .example-prompt {
            background-color: white;
            padding: 10px;
            margin: 10px 0;
            border-radius: 3px;
            cursor: pointer;
            border: 1px solid #ced4da;
        }
        .example-prompt:hover {
            background-color: #f8f9fa;
        }
        .tabs {
            display: flex;
            margin-top: 20px;
            border-bottom: 2px solid #ddd;
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: none;
            border-bottom: 2px solid transparent;
        }
        .tab.active {
            border-bottom-color: #007bff;
            color: #007bff;
        }
        .tab-content {
            display: none;
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            background-color: white;
        }
        .tab-content.active {
            display: block;
        }
        .multi-results {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        .flowchart-item {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            background-color: #f8f9fa;
        }
        .flowchart-item h4 {
            margin-top: 0;
            color: #495057;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Mermaid Flowchart Generator</h1>
        <p style="text-align: center; color: #666;">
            Enter a description and generate AI-powered flowcharts using Django + Gemini AI
        </p>

        <div class="example-prompts">
            <h3>📝 Example Prompts (Click to Use)</h3>
            <div class="example-prompt" onclick="usePrompt(this)">
                Create a movie plot flowchart for a superhero origin story with character development, mentor meeting, villain confrontation, and final battle.
            </div>
            <div class="example-prompt" onclick="usePrompt(this)">
                Design a romantic comedy plot structure with meet-cute, misunderstanding, separation, and reunion scenes.
            </div>
            <div class="example-prompt" onclick="usePrompt(this)">
                Generate a thriller movie flowchart with setup, inciting incident, rising tension, climax, and resolution including plot twists.
            </div>
            <div class="example-prompt" onclick="usePrompt(this)">
                Create a heist movie plot diagram with team assembly, planning phase, execution, complications, and escape sequences.
            </div>
        </div>

        <div class="form-group">
            <label for="description">Describe your flowchart:</label>
            <textarea id="description" placeholder="Enter a detailed description of the movie plot or story structure you want to visualize...">Create a flowchart for a sci-fi movie about time travel with paradoxes, multiple timelines, and a race to prevent a catastrophic future.</textarea>
        </div>

        <button onclick="generateFlowchart()">🚀 Generate Flowchart</button>
        <button onclick="downloadSVG()" class="secondary">⬇️ Generate & Download SVG</button>
        <button onclick="generateMultipleFlowcharts()" class="secondary">🔄 Generate 3 Variations</button>
        <button onclick="clearResult()" class="danger">🗑️ Clear Results</button>

        <div id="result"></div>
    </div>

    <script>
        function usePrompt(element) {
            document.getElementById('description').value = element.textContent.trim();
        }

        function clearResult() {
            document.getElementById('result').innerHTML = '';
        }

        async function generateFlowchart() {
            const description = document.getElementById('description').value;
            const resultDiv = document.getElementById('result');

            if (!description.trim()) {
                resultDiv.innerHTML = '<div class="error">Please enter a description for your flowchart.</div>';
                return;
            }

            resultDiv.innerHTML = '<div class="loading">🔄 Generating flowchart...</div>';

            try {
                const response = await fetch('/api/test/mermaid/', {
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
                            <div class="tabs">
                                <button class="tab active" onclick="showTab('mermaid')">📊 Mermaid Code</button>
                                <button class="tab" onclick="showTab('json')">📋 Full Response</button>
                            </div>
                            <div id="mermaid-tab" class="tab-content active">
                                <h3>Generated Mermaid Code:</h3>
                                <pre id="mermaid-code">${data.mermaid_code}</pre>
                                <p><strong>Description:</strong> ${data.description}</p>
                                <p><em>${data.note || data.message}</em></p>
                            </div>
                            <div id="json-tab" class="tab-content">
                                <h3>Complete API Response:</h3>
                                <pre>${JSON.stringify(data, null, 2)}</pre>
                            </div>
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `<div class="error">❌ Error: ${data.error}</div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="error">❌ Network Error: ${error.message}</div>`;
            }
        }

        async function downloadSVG() {
            const description = document.getElementById('description').value;
            const resultDiv = document.getElementById('result');

            if (!description.trim()) {
                resultDiv.innerHTML = '<div class="error">Please enter a description for your flowchart.</div>';
                return;
            }

            resultDiv.innerHTML = '<div class="loading">📦 Generating SVG file...</div>';

            try {
                const response = await fetch('/api/test/svg/', {
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

                    resultDiv.innerHTML = '<div class="result">✅ SVG file downloaded successfully!</div>';
                } else {
                    const data = await response.json();
                    resultDiv.innerHTML = `<div class="error">❌ Error: ${data.error}</div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="error">❌ Network Error: ${error.message}</div>`;
            }
        }

        async function generateMultipleFlowcharts() {
            const description = document.getElementById('description').value;
            const resultDiv = document.getElementById('result');

            if (!description.trim()) {
                resultDiv.innerHTML = '<div class="error">Please enter a description for your flowchart.</div>';
                return;
            }

            resultDiv.innerHTML = '<div class="loading">🔄 Generating 3 flowchart variations...</div>';

            try {
                // Generate 3 variations with slightly different prompts
                const prompts = [
                    description,
                    description + " - Focus on main workflow steps",
                    description + " - Include error handling and edge cases"
                ];

                const promises = prompts.map((prompt, index) => 
                    fetch('/api/test/mermaid/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            description: prompt
                        })
                    }).then(response => response.json())
                );

                const results = await Promise.all(promises);

                // Display all results
                let html = '<div class="result"><h3>Generated Flowchart Variations:</h3><div class="multi-results">';
                
                results.forEach((data, index) => {
                    if (data.success) {
                        html += `
                            <div class="flowchart-item">
                                <h4>Variation ${index + 1}</h4>
                                <pre>${data.mermaid_code}</pre>
                                <p><small>${data.generation_method || 'Generated'}</small></p>
                            </div>
                        `;
                    } else {
                        html += `
                            <div class="flowchart-item">
                                <h4>Variation ${index + 1}</h4>
                                <p class="error">❌ Error: ${data.error}</p>
                            </div>
                        `;
                    }
                });

                html += '</div></div>';
                resultDiv.innerHTML = html;

            } catch (error) {
                resultDiv.innerHTML = `<div class="error">❌ Network Error: ${error.message}</div>`;
            }
        }

        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');
            event.target.classList.add('active');
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
    return HttpResponse(html_content)