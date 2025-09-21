#!/usr/bin/env python3
"""
Diagnostic tool for troubleshooting Gemini API connectivity
"""
import requests
import os
import ssl
import socket
from urllib3.util import connection

def test_basic_connectivity():
    """Test basic network connectivity to Gemini API"""
    print("🔍 Testing Basic Connectivity...")

    host = "generativelanguage.googleapis.com"
    port = 443

    try:
        # Test DNS resolution
        ip = socket.gethostbyname(host)
        print(f"✅ DNS Resolution: {host} -> {ip}")
    except Exception as e:
        print(f"❌ DNS Resolution Failed: {e}")
        return False

    try:
        # Test socket connection
        sock = socket.create_connection((host, port), timeout=10)
        sock.close()
        print(f"✅ Socket Connection: Can connect to {host}:{port}")
    except Exception as e:
        print(f"❌ Socket Connection Failed: {e}")
        return False

    return True

def test_ssl_connection():
    """Test SSL connection"""
    print("\n🔒 Testing SSL Connection...")

    try:
        context = ssl.create_default_context()
        with socket.create_connection(('generativelanguage.googleapis.com', 443), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname='generativelanguage.googleapis.com') as ssock:
                print(f"✅ SSL Connection: {ssock.version()}")
                cert = ssock.getpeercert()
                print(f"✅ SSL Certificate: {cert['subject']}")
    except Exception as e:
        print(f"❌ SSL Connection Failed: {e}")
        return False

    return True

def test_requests_with_different_configs():
    """Test requests with different SSL configurations"""
    print("\n🌐 Testing Different Request Configurations...")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ No GEMINI_API_KEY found in environment")
        return False

    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

    # Test 1: Default requests
    print("Test 1: Default requests...")
    try:
        response = requests.get(url, timeout=10)
        print(f"✅ Default requests: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Default requests failed: {e}")

    # Test 2: Disable SSL verification (NOT for production!)
    print("Test 2: Disable SSL verification...")
    try:
        response = requests.get(url, timeout=10, verify=False)
        print(f"✅ No SSL verification: {response.status_code}")
        print("⚠️ WARNING: SSL verification disabled!")
        return True
    except Exception as e:
        print(f"❌ No SSL verification failed: {e}")

    # Test 3: Different SSL context
    print("Test 3: Custom SSL context...")
    try:
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        session = requests.Session()
        session.verify = False
        response = session.get(url, timeout=10)
        print(f"✅ Custom session: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Custom session failed: {e}")

    return False

def test_alternative_python_ssl():
    """Test with alternative Python SSL configuration"""
    print("\n🐍 Testing Alternative Python SSL...")

    try:
        # Try with explicit SSL context
        import ssl
        import urllib.request

        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

        api_key = os.getenv("GEMINI_API_KEY")
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

        req = urllib.request.Request(url)
        response = urllib.request.urlopen(req, context=context, timeout=10)
        print(f"✅ urllib with custom SSL: {response.status}")
        return True
    except Exception as e:
        print(f"❌ urllib failed: {e}")

    return False

def suggest_solutions():
    """Suggest potential solutions"""
    print("\n💡 Potential Solutions:")
    print("1. Update your system's CA certificates:")
    print("   sudo apt update && sudo apt install ca-certificates")
    print()
    print("2. Update Python's certificates:")
    print("   pip install --upgrade certifi")
    print()
    print("3. Try using a different DNS server:")
    print("   export DNS_SERVER=8.8.8.8")
    print()
    print("4. Check if you're behind a corporate firewall")
    print()
    print("5. Use requests with custom SSL configuration (temporary):")
    print("   import ssl")
    print("   import requests")
    print("   requests.packages.urllib3.disable_warnings()")
    print("   session = requests.Session()")
    print("   session.verify = False  # Only for testing!")
    print()

def main():
    print("🚀 Gemini API Connectivity Diagnostics")
    print("=" * 50)

    # Check environment
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        print(f"✅ GEMINI_API_KEY found: {api_key[:20]}...")
    else:
        print("❌ GEMINI_API_KEY not found")
        return

    print()

    # Run tests
    basic_ok = test_basic_connectivity()
    ssl_ok = test_ssl_connection() if basic_ok else False
    requests_ok = test_requests_with_different_configs() if basic_ok else False

    if not requests_ok:
        test_alternative_python_ssl()

    print("\n" + "=" * 50)

    if requests_ok:
        print("🎉 SUCCESS: Gemini API is accessible!")
        print("Your Django endpoints should work now.")
    else:
        print("❌ ISSUE: Cannot connect to Gemini API")
        suggest_solutions()

if __name__ == "__main__":
    main()