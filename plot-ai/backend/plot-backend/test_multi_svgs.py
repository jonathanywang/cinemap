#!/usr/bin/env python3
"""
Test script for multi-SVG generation
"""
import requests
import json
import os

def test_multi_svgs():
    """Test the multi-SVG generation endpoint"""
    print("📦 Multi-SVG Generator Test")
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
    print("\n📦 Generating multiple SVG files...")

    try:
        response = requests.post(
            'http://localhost:8000/api/test/multi-svgs/',
            headers={'Content-Type': 'application/json'},
            json={
                'description': story_prompt,
                'character_names': characters,
                'use_ai': True  # Try AI first, fallback if needed
            },
            timeout=120  # Longer timeout for SVG generation
        )

        if response.status_code == 200:
            data = response.json()

            print(f"\n✅ SUCCESS: Generated {data['total_svgs']} SVG files")
            print(f"🤖 Method: {data['generation_method']}")
            print(f"🔗 API Used: {data.get('api_used', 'Unknown')}")

            if not data.get('api_used'):
                print(f"⚠️  Note: {data.get('note', 'Using fallback')}")

            print("\n" + "="*60)
            print("💾 SAVING SVG FILES:")
            print("="*60)

            svg_files = data['svg_files']
            saved_files = []

            for flowchart_key, svg_data in svg_files.items():
                filename = svg_data['filename']
                svg_content = svg_data['svg_content']
                title = svg_data['title']

                # Save to current directory
                with open(filename, 'w') as f:
                    f.write(svg_content)

                saved_files.append(filename)
                print(f"📄 Saved: {filename}")
                print(f"   Title: {title}")

            print("\n" + "="*60)
            print("🎯 SUMMARY:")
            print(f"✓ Total SVG files generated: {data['total_svgs']}")
            print(f"✓ Files saved to current directory:")
            for filename in saved_files:
                print(f"  - {filename}")

            if data.get('api_used'):
                print("✓ AI-powered generation successful!")
            else:
                print("✓ Fallback templates used (AI unavailable)")

            print(f"\n🎨 You can open these SVG files in:")
            print("  - Web browser (drag & drop)")
            print("  - Image viewer")
            print("  - Vector graphics editor (Inkscape, Illustrator)")

        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Error: Django server is not running!")
        print("Please start the server with: python manage.py runserver")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_multi_svgs()