#!/usr/bin/env python3
"""
Interactive prompt interface for testing Mermaid flowchart generation
"""
import requests
import json
import sys

def test_mermaid_generation():
    """Interactive prompt for testing Mermaid generation"""
    print("🎨 Mermaid Flowchart Generator - Interactive Test")
    print("=" * 50)
    print()

    base_url = "http://localhost:8000/api"

    # Test if server is running
    try:
        response = requests.get(f"{base_url}/test/mermaid/", timeout=5)
    except requests.exceptions.ConnectionError:
        print("❌ Error: Django server is not running!")
        print("Please start the server with: .venv/bin/python manage.py runserver")
        return
    except Exception as e:
        print(f"❌ Error connecting to server: {e}")
        return

    print("✅ Server is running!")
    print()

    # Example prompts
    examples = [
        "Create a flowchart for user registration with email verification",
        "Design a workflow for e-commerce order processing",
        "Generate a bug report handling process flowchart",
        "Create a decision tree for customer support system",
        "Design a CI/CD pipeline workflow",
        "Create a flowchart for a Django web application request lifecycle"
    ]

    while True:
        print("📝 Example prompts:")
        for i, example in enumerate(examples, 1):
            print(f"  {i}. {example}")
        print(f"  {len(examples) + 1}. Enter custom prompt")
        print("  0. Exit")
        print()

        try:
            choice = input("Choose an option (0-{}): ".format(len(examples) + 1))

            if choice == '0':
                print("👋 Goodbye!")
                break
            elif choice == str(len(examples) + 1):
                prompt = input("\n📝 Enter your custom prompt: ").strip()
                if not prompt:
                    print("❌ Empty prompt! Please try again.")
                    continue
            else:
                try:
                    choice_idx = int(choice) - 1
                    if 0 <= choice_idx < len(examples):
                        prompt = examples[choice_idx]
                    else:
                        print("❌ Invalid choice! Please try again.")
                        continue
                except ValueError:
                    print("❌ Invalid choice! Please try again.")
                    continue

            print(f"\n🚀 Generating flowchart for: {prompt}")
            print("-" * 60)

            # Make API call
            try:
                response = requests.post(
                    f"{base_url}/test/mermaid/",
                    headers={"Content-Type": "application/json"},
                    json={"description": prompt},
                    timeout=30
                )

                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        print("✅ Generation successful!")
                        print()
                        print("📊 Generated Mermaid Code:")
                        print("-" * 30)
                        print(data['mermaid_code'])
                        print("-" * 30)
                        print()

                        # Ask if user wants to save
                        save = input("💾 Save to file? (y/n): ").lower().strip()
                        if save in ['y', 'yes']:
                            filename = input("📁 Enter filename (or press Enter for 'flowchart.mmd'): ").strip()
                            if not filename:
                                filename = "flowchart.mmd"
                            if not filename.endswith('.mmd'):
                                filename += '.mmd'

                            try:
                                with open(filename, 'w') as f:
                                    f.write(data['mermaid_code'])
                                print(f"✅ Saved to {filename}")
                            except Exception as e:
                                print(f"❌ Error saving file: {e}")

                        # Ask if user wants to download SVG
                        svg = input("⬇️ Download as SVG? (y/n): ").lower().strip()
                        if svg in ['y', 'yes']:
                            try:
                                svg_response = requests.post(
                                    f"{base_url}/test/svg/",
                                    headers={"Content-Type": "application/json"},
                                    json={"description": prompt},
                                    timeout=30
                                )

                                if svg_response.status_code == 200:
                                    svg_filename = input("📁 Enter SVG filename (or press Enter for 'flowchart.svg'): ").strip()
                                    if not svg_filename:
                                        svg_filename = "flowchart.svg"
                                    if not svg_filename.endswith('.svg'):
                                        svg_filename += '.svg'

                                    with open(svg_filename, 'wb') as f:
                                        f.write(svg_response.content)
                                    print(f"✅ SVG saved to {svg_filename}")
                                else:
                                    print("❌ Error downloading SVG")
                            except Exception as e:
                                print(f"❌ Error downloading SVG: {e}")
                    else:
                        print(f"❌ Generation failed: {data.get('error', 'Unknown error')}")
                else:
                    print(f"❌ HTTP Error {response.status_code}: {response.text}")

            except requests.exceptions.Timeout:
                print("❌ Request timed out! The server might be slow or overloaded.")
            except Exception as e:
                print(f"❌ Error making request: {e}")

            print()
            input("Press Enter to continue...")
            print("\n" + "="*50 + "\n")

        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            continue

if __name__ == "__main__":
    test_mermaid_generation()