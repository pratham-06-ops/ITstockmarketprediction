import requests
import json

def test_login():
    """Test the login functionality"""
    base_url = "http://localhost:5000"
    
    # Test data
    test_users = [
        {"username": "admin", "password": "admin123"},
        {"username": "user123", "password": "password123"}
    ]
    
    print("Testing login functionality...")
    
    for user in test_users:
        try:
            response = requests.post(
                f"{base_url}/api/login",
                json=user,
                headers={'Content-Type': 'application/json'}
            )
            
            print(f"\nTesting user: {user['username']}")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login successful for {user['username']}")
                print(f"User data: {data.get('user', {})}")
            else:
                print(f"❌ Login failed for {user['username']}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Cannot connect to server at {base_url}")
            print("Make sure the backend is running with: python app.py")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login() 