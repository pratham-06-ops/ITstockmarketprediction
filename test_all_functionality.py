import requests
import json
import time

def test_all_functionality():
    """Test all functionality of the application"""
    base_url = "http://localhost:5000"
    frontend_url = "http://localhost:3000"
    
    print("🧪 Testing Stock Market Prediction Application")
    print("=" * 50)
    
    # Test 1: Backend Health Check
    print("\n1. Testing Backend Health...")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Backend is running and healthy")
        else:
            print("❌ Backend health check failed")
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return
    
    # Test 2: Login Functionality
    print("\n2. Testing Login Functionality...")
    test_users = [
        {"username": "admin", "password": "admin123"},
        {"username": "user123", "password": "password123"}
    ]
    
    session = requests.Session()
    
    for user in test_users:
        try:
            response = session.post(
                f"{base_url}/api/login",
                json=user,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login successful for {user['username']}")
                print(f"   User data: {data.get('user', {})}")
            else:
                print(f"❌ Login failed for {user['username']}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing login for {user['username']}: {e}")
    
    # Test 3: Get Available Stocks
    print("\n3. Testing Stock Data...")
    try:
        response = session.get(f"{base_url}/api/stocks")
        if response.status_code == 200:
            data = response.json()
            print("✅ Available stocks retrieved successfully")
            for stock in data.get('stocks', []):
                print(f"   - {stock['symbol']}: {stock['name']}")
        else:
            print("❌ Failed to get stocks")
    except Exception as e:
        print(f"❌ Error getting stocks: {e}")
    
    # Test 4: Get Statistics
    print("\n4. Testing Statistics...")
    try:
        response = session.get(f"{base_url}/api/stats")
        if response.status_code == 200:
            data = response.json()
            print("✅ Statistics retrieved successfully")
            print(f"   Total users: {data.get('total_users', 0)}")
            print(f"   Total predictions: {data.get('total_predictions', 0)}")
        else:
            print("❌ Failed to get statistics")
    except Exception as e:
        print(f"❌ Error getting statistics: {e}")
    
    # Test 5: Frontend Health Check
    print("\n5. Testing Frontend...")
    try:
        response = requests.get(frontend_url)
        if response.status_code == 200:
            print("✅ Frontend is running and accessible")
        else:
            print("❌ Frontend health check failed")
    except Exception as e:
        print(f"❌ Cannot connect to frontend: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Testing Complete!")
    print("\nTo access the application:")
    print(f"Frontend: {frontend_url}")
    print(f"Backend API: {base_url}")
    print("\nDemo Credentials:")
    print("Admin: admin / admin123")
    print("User: user123 / password123")

if __name__ == "__main__":
    test_all_functionality() 