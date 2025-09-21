let currentMode = 'multi';

function setMode(mode) {
    console.log('setMode called with:', mode);
    currentMode = mode;
    const singleMode = document.getElementById('single-mode');
    const multiMode = document.getElementById('multi-mode');
    const singlePrompts = document.getElementById('single-prompts');
    const multiPrompts = document.getElementById('multi-prompts');
    const charactersSection = document.getElementById('characters-section');
    const singleButtons = document.getElementById('single-buttons');
    const multiButtons = document.getElementById('multi-buttons');
    const descriptionLabel = document.getElementById('description-label');

    if (mode === 'single') {
        singleMode.classList.add('active');
        multiMode.classList.remove('active');
        singlePrompts.style.display = 'block';
        multiPrompts.style.display = 'none';
        charactersSection.style.display = 'none';
        singleButtons.style.display = 'block';
        multiButtons.style.display = 'none';
        descriptionLabel.textContent = 'Describe your flowchart:';
        document.getElementById('description').placeholder = 'Enter a detailed description of the process or workflow you want to visualize...';
        document.getElementById('description').value = 'Create a flowchart for a Django web application user authentication system with login, registration, and password reset functionality.';
    } else {
        multiMode.classList.add('active');
        singleMode.classList.remove('active');
        multiPrompts.style.display = 'block';
        singlePrompts.style.display = 'none';
        charactersSection.style.display = 'block';
        multiButtons.style.display = 'block';
        singleButtons.style.display = 'none';
        descriptionLabel.textContent = 'Describe your story:';
        document.getElementById('description').placeholder = 'Enter a detailed story description with multiple characters...';
        document.getElementById('description').value = 'A epic fantasy adventure where three unlikely heroes must save their kingdom from the ancient dragon Shadowfire. The heroes must overcome their differences, face their personal demons, and unite their unique strengths to defeat the dragon and save the realm.';
    }
}

function usePrompt(element) {
    document.getElementById('description').value = element.textContent.trim();
}

function useStoryPrompt(element) {
    document.getElementById('description').value = element.textContent.trim();
    const characters = JSON.parse(element.getAttribute('data-characters'));
    document.getElementById('characters').value = characters.join('\n');
}

function clearResult() {
    document.getElementById('result').innerHTML = '';
}

async function generateMultiFlowcharts() {
    console.log('generateMultiFlowcharts called');
    const description = document.getElementById('description').value;
    const charactersText = document.getElementById('characters').value;
    const resultDiv = document.getElementById('result');

    if (!description.trim()) {
        resultDiv.innerHTML = '<div class="error">Please enter a story description.</div>';
        return;
    }

    const characterNames = charactersText.split('\n').map(name => name.trim()).filter(name => name.length > 0);
    if (characterNames.length === 0) {
        resultDiv.innerHTML = '<div class="error">Please enter at least one character name.</div>';
        return;
    }

    resultDiv.innerHTML = '<div class="loading">🎭 Generating multiple flowcharts...</div>';

    try {
        const response = await fetch('/api/test/multi-flowcharts/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: description,
                character_names: characterNames
            })
        });

        const data = await response.json();

        if (data.success) {
            // Create tabs for each flowchart
            const flowcharts = data.flowcharts;
            let tabsHtml = '<div class="tabs">';
            let contentHtml = '';

            // Add ensemble tab first
            tabsHtml += '<button class="tab active" onclick="showMultiTab(\'ensemble\')">🎭 Ensemble</button>';

            // Add character tabs
            for (let i = 1; i <= characterNames.length; i++) {
                const charKey = 'character_' + i;
                if (flowcharts[charKey]) {
                    const charName = flowcharts[charKey].character_name;
                    tabsHtml += '<button class="tab" onclick="showMultiTab(\'' + charKey + '\')">👤 ' + charName + '</button>';
                }
            }

            tabsHtml += '<button class="tab" onclick="showMultiTab(\'json\')">📋 Full Response</button>';
            tabsHtml += '</div>';

            // Add ensemble content
            contentHtml += '<div id="ensemble-tab" class="tab-content active">' +
                '<h3>' + flowcharts.ensemble.title + '</h3>' +
                '<pre>' + flowcharts.ensemble.mermaid_code + '</pre>' +
                '<p><em>' + flowcharts.ensemble.description + '</em></p>' +
                '</div>';

            // Add character contents
            for (let i = 1; i <= characterNames.length; i++) {
                const charKey = 'character_' + i;
                if (flowcharts[charKey]) {
                    const char = flowcharts[charKey];
                    contentHtml += '<div id="' + charKey + '-tab" class="tab-content">' +
                        '<h3>' + char.title + '</h3>' +
                        '<pre>' + char.mermaid_code + '</pre>' +
                        '<p><em>' + char.description + '</em></p>' +
                        '</div>';
                }
            }

            // Add JSON tab
            contentHtml += '<div id="json-tab" class="tab-content">' +
                '<h3>Complete API Response:</h3>' +
                '<pre>' + JSON.stringify(data, null, 2) + '</pre>' +
                '</div>';

            resultDiv.innerHTML = '<div class="result">' +
                '<h2>✅ Generated ' + data.total_flowcharts + ' Flowcharts</h2>' +
                '<p><strong>Method:</strong> ' + data.generation_method + '</p>' +
                (data.note ? '<p><em>' + data.note + '</em></p>' : '') +
                tabsHtml +
                contentHtml +
                '</div>';

            // Enable download button
            document.querySelector('#multi-buttons button[onclick="downloadAllSVGs()"]').disabled = false;
        } else {
            resultDiv.innerHTML = '<div class="error">❌ Error: ' + data.error + '</div>';
        }
    } catch (error) {
        resultDiv.innerHTML = '<div class="error">❌ Network Error: ' + error.message + '</div>';
    }
}

function showMultiTab(tabName) {
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
            resultDiv.innerHTML = '<div class="result">' +
                '<div class="tabs">' +
                    '<button class="tab active" onclick="showTab(\'mermaid\')">📊 Mermaid Code</button>' +
                    '<button class="tab" onclick="showTab(\'json\')">📋 Full Response</button>' +
                '</div>' +
                '<div id="mermaid-tab" class="tab-content active">' +
                    '<h3>Generated Mermaid Code:</h3>' +
                    '<pre id="mermaid-code">' + data.mermaid_code + '</pre>' +
                    '<p><strong>Description:</strong> ' + data.description + '</p>' +
                    '<p><em>' + (data.note || data.message) + '</em></p>' +
                '</div>' +
                '<div id="json-tab" class="tab-content">' +
                    '<h3>Complete API Response:</h3>' +
                    '<pre>' + JSON.stringify(data, null, 2) + '</pre>' +
                '</div>' +
                '</div>';
        } else {
            resultDiv.innerHTML = '<div class="error">❌ Error: ' + data.error + '</div>';
        }
    } catch (error) {
        resultDiv.innerHTML = '<div class="error">❌ Network Error: ' + error.message + '</div>';
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
            resultDiv.innerHTML = '<div class="error">❌ Error: ' + data.error + '</div>';
        }
    } catch (error) {
        resultDiv.innerHTML = '<div class="error">❌ Network Error: ' + error.message + '</div>';
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

async function downloadAllSVGs() {
    const description = document.getElementById('description').value;
    const charactersText = document.getElementById('characters').value;

    if (!description.trim()) {
        alert('Please enter a story description first.');
        return;
    }

    const characterNames = charactersText.split('\n').map(name => name.trim()).filter(name => name.length > 0);
    if (characterNames.length === 0) {
        alert('Please enter at least one character name first.');
        return;
    }

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<div class="loading">📦 Generating and downloading SVG files...</div>';

    try {
        const response = await fetch('/api/test/multi-svgs/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: description,
                character_names: characterNames
            })
        });

        const data = await response.json();

        if (data.success) {
            // Download each SVG file
            const svgFiles = data.svg_files;
            for (const [key, svgData] of Object.entries(svgFiles)) {
                const blob = new Blob([svgData.svg_content], { type: 'image/svg+xml' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = svgData.filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            resultDiv.innerHTML = '<div class="result">' +
                '<h2>✅ Downloaded ' + data.total_svgs + ' SVG Files</h2>' +
                '<p><strong>Method:</strong> ' + data.generation_method + '</p>' +
                (data.note ? '<p><em>' + data.note + '</em></p>' : '') +
                '<ul>' +
                Object.values(svgFiles).map(function(svg) { return '<li>' + svg.filename + ' - ' + svg.title + '</li>'; }).join('') +
                '</ul>' +
                '</div>';
        } else {
            resultDiv.innerHTML = '<div class="error">❌ Error: ' + data.error + '</div>';
        }
    } catch (error) {
        resultDiv.innerHTML = '<div class="error">❌ Network Error: ' + error.message + '</div>';
    }
}

// Allow Ctrl+Enter to generate
document.getElementById('description').addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        if (currentMode === 'multi') {
            generateMultiFlowcharts();
        } else {
            generateFlowchart();
        }
    }
});

// Initialize to multi mode on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing multi mode');
    setMode('multi');
});
