#!/usr/bin/env python3
"""
Test script to verify admin prediction management functionality
"""

import requests
import json
import sys
import time

# Configuration
BASE_URL = "http://localhost:5000"
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}
REGULAR_USER_CREDENTIALS = {"username": "testuser", "password": "testpass123"}

def print_result(test_name, success, message=""):
    """Print test result with colored output"""
    if success:
        print(f"✅ {test_name}: PASSED")
        if message:
            print(f"   {message}")
    else:
        print(f"❌ {test_name}: FAILED")
        if message:
            print(f"   {message}")
    print()

def create_test_user():
    """Create a test user for permission testing"""
    try:
        response = requests.post(f"{BASE_URL}/api/register", json={
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "testpass123"
        })
        return response.status_code == 201
    except:
        return False

def get_auth_token(credentials):
    """Get authentication token"""
    try:
        response = requests.post(f"{BASE_URL}/api/login", json=credentials)
        if response.status_code == 200:
            return response.json().get('user', {}).get('id'), response.cookies.get('session')
        return None, None
    except:
        return None, None

def test_admin_login():
    """Test admin login functionality"""
    try:
        response = requests.post(f"{BASE_URL}/api/login", json=ADMIN_CREDENTIALS)
        if response.status_code == 200:
            user_data = response.json().get('user', {})
            if user_data.get('is_admin'):
                return True, "Admin login successful"
        return False, "Admin login failed"
    except Exception as e:
        return False, f"Admin login error: {str(e)}"

def test_admin_get_predictions(admin_cookie):
    """Test admin can get all predictions"""
    try:
        response = requests.get(f"{BASE_URL}/api/admin/predictions", cookies={'session': admin_cookie})
        if response.status_code == 200:
            data = response.json()
            if 'predictions' in data:
                return True, f"Found {len(data['predictions'])} predictions"
        return False, f"Status: {response.status_code}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def test_regular_user_admin_access(regular_cookie):
    """Test regular user cannot access admin endpoints"""
    try:
        response = requests.get(f"{BASE_URL}/api/admin/predictions", cookies={'session': regular_cookie})
        if response.status_code == 403:
            return True, "Regular user correctly blocked from admin endpoint"
        return False, f"Unexpected status: {response.status_code}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def test_prediction_update(admin_cookie, prediction_id):
    """Test prediction update functionality"""
    try:
        update_data = {
            "actual_price": 1500.50,
            "model_used": "lstm",
            "confidence_score": 0.85
        }
        response = requests.put(
            f"{BASE_URL}/api/admin/predictions/{prediction_id}",
            json=update_data,
            cookies={'session': admin_cookie}
        )
        if response.status_code == 200:
            return True, "Prediction updated successfully"
        return False, f"Status: {response.status_code}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def test_prediction_delete(admin_cookie, prediction_id):
    """Test prediction delete functionality"""
    try:
        response = requests.delete(
            f"{BASE_URL}/api/admin/predictions/{prediction_id}",
            cookies={'session': admin_cookie}
        )
        if response.status_code == 200:
            return True, "Prediction deleted successfully"
        return False, f"Status: {response.status_code}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    """Main test function"""
    print("🧪 Testing Admin Prediction Management Functionality")
    print("=" * 60)
    
    # Create test user first
    print("Creating test user...")
    if create_test_user():
        print_result("Test User Creation", True, "Test user created successfully")
    else:
        print_result("Test User Creation", False, "Failed to create test user")
    
    # Test admin login
    admin_id, admin_cookie = get_auth_token(ADMIN_CREDENTIALS)
    success, message = test_admin_login()
    print_result("Admin Login", success, message)
    
    if not admin_cookie:
        print("❌ Cannot proceed without admin authentication")
        return False
    
    # Test regular user login
    regular_id, regular_cookie = get_auth_token(REGULAR_USER_CREDENTIALS)
    print_result("Regular User Login", regular_cookie is not None, 
                "Regular user login successful" if regular_cookie else "Regular user login failed")
    
    # Test admin access to predictions
    success, message = test_admin_get_predictions(admin_cookie)
    print_result("Admin Get All Predictions", success, message)
    
    # Test regular user cannot access admin endpoints
    if regular_cookie:
        success, message = test_regular_user_admin_access(regular_cookie)
        print_result("Regular User Admin Access Block", success, message)
    
    # Get a prediction ID for testing update/delete
    try:
        response = requests.get(f"{BASE_URL}/api/admin/predictions", cookies={'session': admin_cookie})
        if response.status_code == 200:
            predictions = response.json().get('predictions', [])
            if predictions:
                test_prediction = predictions[0]
                prediction_id = test_prediction['id']
                
                # Test prediction update
                success, message = test_prediction_update(admin_cookie, prediction_id)
                print_result("Prediction Update", success, message)
                
                # Test prediction delete
                success, message = test_prediction_delete(admin_cookie, prediction_id)
                print_result("Prediction Delete", success, message)
            else:
                print("⚠️  No predictions found for testing update/delete")
        else:
            print("⚠️  Cannot get predictions for testing update/delete")
    except Exception as e:
        print(f"⚠️  Error getting predictions: {str(e)}")
    
    print("=" * 60)
    print("🎯 Testing completed!")
    print("\nTo test frontend functionality:")
    print("1. Start the backend: python backend/app.py")
    print("2. Start the frontend: cd frontend && npm start")
    print("3. Login as admin (admin/admin123)")
    print("4. Navigate to Admin Dashboard -> All Predictions")
    print("5. Test edit and delete functionality")
    
    return True

if __name__ == "__main__":
    main()
