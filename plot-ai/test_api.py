#!/usr/bin/env python3
import requests
import json

# Test the API directly
base_url = 'http://localhost:8002/api'

print("Testing API directly...")

# Test 1: Try to get user info (should fail)
print("\n1. Testing /auth/user/ without token:")
response = requests.get(f'{base_url}/auth/user/')
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:200]}")

# Test 2: Try to login and get token
print("\n2. Testing login:")
login_data = {'username': 'admin', 'password': 'admin'}
response = requests.post(f'{base_url}/auth/login/', json=login_data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")

if response.status_code == 200:
    try:
        data = response.json()
        token = data.get('token')
        print(f"Got token: {token}")

        if token:
            # Test 3: Use token to access protected endpoint
            print("\n3. Testing with token:")
            headers = {'Authorization': f'Token {token}'}
            response = requests.get(f'{base_url}/auth/user/', headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")

            # Test 4: Try to create visualization request
            print("\n4. Testing visualization request creation:")
            viz_data = {
                'story': '2e71bccd-73e6-441e-9d86-505247f98877',  # Jamie's story ID
                'visualization_type': 'flowchart',
                'parameters': {}
            }
            response = requests.post(f'{base_url}/visualization-requests/', json=viz_data, headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error parsing response: {e}")