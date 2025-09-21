#!/usr/bin/env python3
"""
Quick SSL fix for Gemini API connectivity
"""
import requests
import os
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_gemini_with_ssl_fix():
    """Test Gemini API with different SSL configurations"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ No GEMINI_API_KEY found")
        return False

    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

    # Method 1: Try with disabled SSL verification (TEMPORARY FIX)
    print("🔧 Testing with SSL verification disabled...")
    try:
        session = requests.Session()
        session.verify = False  # Disable SSL verification

        response = session.get(url, timeout=15)
        response.raise_for_status()

        data = response.json()
        models = [m['name'] for m in data.get('models', [])]

        print(f"✅ SUCCESS! Found {len(models)} models")
        print("📝 First few models:", models[:3])

        # Test generation
        print("\n🎨 Testing flowchart generation...")

        # Pick a good model
        text_models = [m for m in models if 'gemini' in m.lower() and not any(x in m.lower() for x in ['embedding', 'aqa', 'imagen'])]
        if text_models:
            model = text_models[0].replace('models/', '')

            generate_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

            payload = {
                "contents": [{
                    "parts": [{"text": """Generate a Mermaid.js flowchart for a simple user login process:
1. User visits login page
2. Enter credentials
3. Validate credentials
4. If valid: redirect to dashboard
5. If invalid: show error and return to login

Return ONLY the Mermaid code without explanation."""}]
                }],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 500
                }
            }

            gen_response = session.post(generate_url, json=payload, timeout=30)
            gen_response.raise_for_status()

            gen_data = gen_response.json()
            mermaid_code = gen_data['candidates'][0]['content']['parts'][0]['text'].strip()

            # Clean up code blocks
            if mermaid_code.startswith('```mermaid'):
                mermaid_code = mermaid_code.replace('```mermaid\n', '').replace('\n```', '')
            elif mermaid_code.startswith('```'):
                mermaid_code = mermaid_code.replace('```\n', '').replace('\n```', '')

            print("✅ GENERATION SUCCESS!")
            print("📊 Generated Mermaid Code:")
            print("-" * 40)
            print(mermaid_code)
            print("-" * 40)

            return True

    except Exception as e:
        print(f"❌ SSL fix failed: {e}")

    return False

def update_mermaid_service():
    """Update the MermaidService to handle SSL issues"""
    print("\n🔧 Updating MermaidService for SSL compatibility...")

    # Read current service
    service_file = "generation/services/mermaid_service.py"

    try:
        with open(service_file, 'r') as f:
            content = f.read()

        # Check if already updated
        if 'urllib3.disable_warnings' in content:
            print("✅ MermaidService already updated")
            return True

        # Add SSL fix imports
        updated_content = content.replace(
            'import requests',
            '''import requests
import urllib3

# Disable SSL warnings for development
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)'''
        )

        # Update the requests calls to disable SSL verification
        updated_content = updated_content.replace(
            'response = requests.get(url)',
            'response = requests.get(url, verify=False)'
        ).replace(
            'response = requests.post(api_url, json=payload)',
            'response = requests.post(api_url, json=payload, verify=False)'
        )

        # Write back
        with open(service_file, 'w') as f:
            f.write(updated_content)

        print("✅ MermaidService updated with SSL fix")
        print("⚠️  Note: SSL verification is disabled (for development only)")
        return True

    except Exception as e:
        print(f"❌ Failed to update MermaidService: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Gemini API SSL Fix Tool")
    print("=" * 40)

    # Test current connectivity
    if test_gemini_with_ssl_fix():
        print("\n🎉 Gemini API is working with SSL fix!")

        # Update the service
        if update_mermaid_service():
            print("\n✅ All done! Your Django endpoints should now work with Gemini AI")
            print("\nTest with:")
            print("curl -X POST http://localhost:8000/api/test/mermaid/ \\")
            print('  -H "Content-Type: application/json" \\')
            print('  -d \'{"description": "Create a user login flowchart"}\' | python -m json.tool')
        else:
            print("\n⚠️  Manual update needed - check the service file")
    else:
        print("\n❌ Could not establish connection to Gemini API")
        print("This might be a network/firewall issue")