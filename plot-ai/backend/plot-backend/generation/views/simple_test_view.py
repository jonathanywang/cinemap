from django.shortcuts import render
from django.http import HttpResponse

def simple_test_view(request):
    """Simple test view with proper CSRF token handling"""
    html_content = '''
<!DOCTYPE html>
<html>
<head>
    <title>Simple Test</title>
</head>
<body>
    <h1>Simple Multi-Flowchart Test</h1>

    <textarea id="description" placeholder="Story description...">A epic fantasy adventure where three unlikely heroes must save their kingdom.</textarea><br><br>

    <textarea id="characters" placeholder="Character names...">Hero
Mentor
Villain</textarea><br><br>

    <button onclick="testMultiFlowcharts()">Generate Multi-Flowcharts</button>

    <div id="result"></div>

    <script>
        console.log('Script loaded');

        // Get CSRF token from cookie
        function getCSRFToken() {
            const name = 'csrftoken';
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }

        async function testMultiFlowcharts() {
            console.log('testMultiFlowcharts called');

            const description = document.getElementById('description').value;
            const charactersText = document.getElementById('characters').value;
            const resultDiv = document.getElementById('result');

            const characterNames = charactersText.split('\\n').map(name => name.trim()).filter(name => name.length > 0);

            console.log('Description:', description);
            console.log('Character names:', characterNames);

            resultDiv.innerHTML = 'Loading...';

            try {
                const csrfToken = getCSRFToken();
                console.log('CSRF Token:', csrfToken);

                const headers = {
                    'Content-Type': 'application/json',
                };
                if (csrfToken) {
                    headers['X-CSRFToken'] = csrfToken;
                }

                const response = await fetch('/api/test/multi-flowcharts/', {
                    method: 'POST',
                    headers: headers,
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        description: description,
                        character_names: characterNames
                    })
                });

                console.log('Response received:', response.status);

                const data = await response.json();
                console.log('Data:', data);

                if (data.success) {
                    resultDiv.innerHTML = '<h3>Success!</h3><p>Generated ' + data.total_flowcharts + ' flowcharts using ' + data.generation_method + '</p>';
                } else {
                    resultDiv.innerHTML = '<h3>Error:</h3><p>' + data.error + '</p>';
                }
            } catch (error) {
                console.error('Error:', error);
                resultDiv.innerHTML = '<h3>Network Error:</h3><p>' + error.message + '</p>';
            }
        }

        console.log('Script end');
    </script>
</body>
</html>
    '''
    return HttpResponse(html_content)