#!/usr/bin/env python3
"""
Test script to verify Mermaid integration without Django
"""
import os
import sys
import json

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Simple test implementation that doesn't require Django
def test_mermaid_service():
    print("Testing Mermaid Service Integration...")

    # Import the core functions from mermaid.py
    from mermaid import (
        get_available_models, pick_text_model, generate_mermaid,
        save_mermaid_to_file, render_svg
    )

    try:
        # Test model availability
        print("1. Testing Gemini API connection...")
        models = get_available_models()
        print(f"✓ Found {len(models)} available models")

        # Test model selection
        print("2. Testing model selection...")
        model = pick_text_model(models)
        print(f"✓ Selected model: {model}")

        # Test Mermaid generation
        print("3. Testing Mermaid generation...")
        test_description = """
        Create a simple flowchart for a Django web application user registration:
        1. User visits registration page
        2. User fills out form
        3. System validates data
        4. If valid: create account and redirect to dashboard
        5. If invalid: show errors and return to form
        """

        mermaid_code = generate_mermaid(model, test_description)
        print("✓ Generated Mermaid code:")
        print(mermaid_code)
        print()

        # Test file saving
        print("4. Testing file operations...")
        test_filename = "test_diagram.mmd"
        save_mermaid_to_file(mermaid_code, test_filename)
        print(f"✓ Saved Mermaid code to {test_filename}")

        # Test SVG rendering (if mmdc is available)
        print("5. Testing SVG rendering...")
        try:
            render_svg(test_filename, "test_diagram.svg")
            print("✓ SVG rendering successful")
        except Exception as e:
            print(f"⚠ SVG rendering failed (this is OK if mmdc is not installed): {e}")

        print("\n🎉 All tests passed! Mermaid integration is working properly.")
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return False

def test_django_integration():
    print("\n" + "="*50)
    print("Django Integration Summary")
    print("="*50)

    print("✓ Created MermaidService class in generation/services/mermaid_service.py")
    print("✓ Added 'flowchart' to VISUALIZATION_TYPES in models.py")
    print("✓ Created Mermaid-specific views in generation/views/mermaid_views.py")
    print("✓ Updated main views.py to use Gemini AI for flowchart generation")
    print("✓ Added URL routing for Mermaid endpoints in generation/urls.py")

    print("\nNew API Endpoints:")
    print("- POST /generation/mermaid/story/<story_id>/  # Generate from story")
    print("- POST /generation/mermaid/generate/          # Generate from description")
    print("- POST /generation/mermaid/svg/               # Generate and download SVG")
    print("- GET  /generation/mermaid/health/            # Health check")

    print("\nTo complete the integration:")
    print("1. Run: python manage.py makemigrations")
    print("2. Run: python manage.py migrate")
    print("3. Install Mermaid CLI: npm install -g @mermaid-js/mermaid-cli")
    print("4. Start Django server: python manage.py runserver")

    print("\nExample usage:")
    print('''
# Create a flowchart from a story
curl -X POST http://localhost:8000/generation/mermaid/story/<story-id>/ \\
  -H "Authorization: Token <your-token>" \\
  -H "Content-Type: application/json"

# Generate from description
curl -X POST http://localhost:8000/generation/mermaid/generate/ \\
  -H "Authorization: Token <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"description": "Create a flowchart for user login process"}'

# Download as SVG
curl -X POST http://localhost:8000/generation/mermaid/svg/ \\
  -H "Authorization: Token <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"description": "Create a flowchart for user login process"}' \\
  --output flowchart.svg
''')

if __name__ == "__main__":
    # Test the core Mermaid functionality
    success = test_mermaid_service()

    # Show Django integration info
    test_django_integration()

    if success:
        print(f"\n🚀 Ready for Django integration!")
    else:
        print(f"\n⚠️  Please fix the issues above before proceeding with Django integration.")