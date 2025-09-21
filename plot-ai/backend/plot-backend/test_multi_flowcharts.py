#!/usr/bin/env python3
"""
Test script for multi-flowchart generation
"""
import requests
import json

def test_multi_flowcharts():
    """Test the multi-flowchart generation endpoint"""
    print("🎭 Multi-Flowchart Generator Test")
    print("=" * 50)

    # Example story with characters
    story_prompt = """
A epic fantasy adventure where three unlikely heroes must save their kingdom:

- ARIA: A brave warrior princess who values honor above all else
- SAGE: A wise but reclusive mage who struggles with self-doubt
- FINN: A clever street thief with a heart of gold

The ancient dragon Shadowfire has awakened and threatens to destroy everything.
The three heroes must overcome their differences, face their personal demons,
and unite their unique strengths to defeat the dragon and save the realm.
"""

    characters = ["Aria the Warrior", "Sage the Mage", "Finn the Rogue"]

    print("📝 Story:")
    print(story_prompt.strip())
    print(f"\n👥 Characters: {', '.join(characters)}")
    print("\n🚀 Generating multiple flowcharts...")

    try:
        response = requests.post(
            'http://localhost:8000/api/test/multi-flowcharts/',
            headers={'Content-Type': 'application/json'},
            json={
                'description': story_prompt,
                'character_names': characters,
                'use_ai': True  # Try AI first, fallback if needed
            },
            timeout=60
        )

        if response.status_code == 200:
            data = response.json()

            print(f"\n✅ SUCCESS: Generated {data['total_flowcharts']} flowcharts")
            print(f"🤖 Method: {data['generation_method']}")
            print(f"🔗 API Used: {data.get('api_used', 'Unknown')}")

            if not data.get('api_used'):
                print(f"⚠️  Note: {data.get('note', 'Using fallback')}")

            print("\n" + "="*60)
            print("📊 GENERATED FLOWCHARTS:")
            print("="*60)

            # Display ensemble flowchart
            ensemble = data['flowcharts']['ensemble']
            print(f"\n🎭 {ensemble['title'].upper()}")
            print("─" * 50)
            print(ensemble['mermaid_code'])

            # Display character flowcharts
            for i, character in enumerate(characters, 1):
                char_key = f'character_{i}'
                if char_key in data['flowcharts']:
                    char_flow = data['flowcharts'][char_key]
                    print(f"\n👤 {char_flow['title'].upper()}")
                    print("─" * 50)
                    print(char_flow['mermaid_code'])

            print("\n" + "="*60)
            print("🎯 SUMMARY:")
            print(f"✓ Ensemble flowchart: Overall story structure")
            print(f"✓ Character flowcharts: {len(characters)} individual character arcs")
            print(f"✓ Total flowcharts: {data['total_flowcharts']}")

            if data.get('api_used'):
                print("✓ AI-powered generation successful!")
            else:
                print("✓ Fallback templates used (AI unavailable)")

        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Error: Django server is not running!")
        print("Please start the server with: python manage.py runserver")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_multi_flowcharts()