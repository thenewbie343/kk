#!/usr/bin/env python3
"""
Backend API Testing for Bakery Website
Tests all API endpoints with realistic bakery data
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Backend URL from frontend/.env
BACKEND_URL = "https://0501cdf5-a7c1-4cac-9de9-dc190f7ce216.preview.emergentagent.com/api"

def test_api_root():
    """Test the root API endpoint"""
    print("🧪 Testing API Root Endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            if "message" in data and "Artisan Bakery" in data["message"]:
                print("✅ API Root endpoint working correctly")
                return True
            else:
                print("❌ API Root endpoint returned unexpected response")
                return False
        else:
            print(f"❌ API Root endpoint failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API Root endpoint error: {str(e)}")
        return False

def test_menu_all_items():
    """Test GET /api/menu - all menu items"""
    print("\n🧪 Testing Menu API - All Items...")
    try:
        response = requests.get(f"{BACKEND_URL}/menu")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total menu items: {len(data)}")
            
            # Verify we have both bakery and cafe items
            bakery_items = [item for item in data if item.get('category') == 'bakery']
            cafe_items = [item for item in data if item.get('category') == 'cafe']
            
            print(f"Bakery items: {len(bakery_items)}")
            print(f"Café items: {len(cafe_items)}")
            
            # Check sample items
            sample_items = ["Artisan Croissants", "Signature Latte", "Pain au Chocolat"]
            found_items = [item['name'] for item in data if item['name'] in sample_items]
            print(f"Sample items found: {found_items}")
            
            if len(data) > 0 and len(bakery_items) > 0 and len(cafe_items) > 0:
                print("✅ Menu API (all items) working correctly")
                return True, data
            else:
                print("❌ Menu API missing expected items")
                return False, []
        else:
            print(f"❌ Menu API failed with status {response.status_code}")
            return False, []
    except Exception as e:
        print(f"❌ Menu API error: {str(e)}")
        return False, []

def test_menu_by_category():
    """Test GET /api/menu/{category} - bakery and cafe items separately"""
    print("\n🧪 Testing Menu API - By Category...")
    
    # Test bakery category
    try:
        response = requests.get(f"{BACKEND_URL}/menu/bakery")
        print(f"Bakery Category Status Code: {response.status_code}")
        
        if response.status_code == 200:
            bakery_data = response.json()
            print(f"Bakery items: {len(bakery_data)}")
            
            # Verify all items are bakery category
            all_bakery = all(item.get('category') == 'bakery' for item in bakery_data)
            if all_bakery and len(bakery_data) > 0:
                print("✅ Bakery category API working correctly")
                bakery_success = True
            else:
                print("❌ Bakery category API returned incorrect items")
                bakery_success = False
        else:
            print(f"❌ Bakery category API failed with status {response.status_code}")
            bakery_success = False
    except Exception as e:
        print(f"❌ Bakery category API error: {str(e)}")
        bakery_success = False
    
    # Test cafe category
    try:
        response = requests.get(f"{BACKEND_URL}/menu/cafe")
        print(f"Café Category Status Code: {response.status_code}")
        
        if response.status_code == 200:
            cafe_data = response.json()
            print(f"Café items: {len(cafe_data)}")
            
            # Verify all items are cafe category
            all_cafe = all(item.get('category') == 'cafe' for item in cafe_data)
            if all_cafe and len(cafe_data) > 0:
                print("✅ Café category API working correctly")
                cafe_success = True
            else:
                print("❌ Café category API returned incorrect items")
                cafe_success = False
        else:
            print(f"❌ Café category API failed with status {response.status_code}")
            cafe_success = False
    except Exception as e:
        print(f"❌ Café category API error: {str(e)}")
        cafe_success = False
    
    return bakery_success and cafe_success

def test_create_order():
    """Test POST /api/orders - create new order"""
    print("\n🧪 Testing Order Creation API...")
    
    # Realistic bakery order data
    order_data = {
        "customer_name": "Sarah Johnson",
        "customer_email": "sarah.johnson@email.com",
        "customer_phone": "555-0198",
        "pickup_time": (datetime.now() + timedelta(hours=2)).isoformat(),
        "special_requests": "Please make the croissants extra flaky and warm",
        "total_amount": 15.25,
        "items": [
            {
                "id": "item1",
                "name": "Artisan Croissants",
                "price": 3.50,
                "quantity": 2,
                "category": "bakery"
            },
            {
                "id": "item2", 
                "name": "Signature Latte",
                "price": 4.50,
                "quantity": 1,
                "category": "cafe"
            },
            {
                "id": "item3",
                "name": "Pain au Chocolat", 
                "price": 4.25,
                "quantity": 1,
                "category": "bakery"
            }
        ]
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/orders", json=order_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            created_order = response.json()
            print(f"Order created with ID: {created_order.get('id')}")
            print(f"Customer: {created_order.get('customer_name')}")
            print(f"Total: ${created_order.get('total_amount')}")
            print(f"Items count: {len(created_order.get('items', []))}")
            
            # Verify order data
            if (created_order.get('customer_name') == order_data['customer_name'] and
                created_order.get('total_amount') == order_data['total_amount'] and
                len(created_order.get('items', [])) == len(order_data['items'])):
                print("✅ Order creation API working correctly")
                return True, created_order.get('id')
            else:
                print("❌ Order creation API returned incorrect data")
                return False, None
        else:
            print(f"❌ Order creation API failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Order creation API error: {str(e)}")
        return False, None

def test_get_all_orders():
    """Test GET /api/orders - get all orders"""
    print("\n🧪 Testing Get All Orders API...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/orders")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            orders = response.json()
            print(f"Total orders found: {len(orders)}")
            
            if len(orders) > 0:
                # Check first order structure
                first_order = orders[0]
                required_fields = ['id', 'customer_name', 'customer_email', 'items', 'total_amount']
                has_required_fields = all(field in first_order for field in required_fields)
                
                if has_required_fields:
                    print("✅ Get all orders API working correctly")
                    return True, orders
                else:
                    print("❌ Orders missing required fields")
                    return False, []
            else:
                print("✅ Get all orders API working (no orders yet)")
                return True, []
        else:
            print(f"❌ Get all orders API failed with status {response.status_code}")
            return False, []
    except Exception as e:
        print(f"❌ Get all orders API error: {str(e)}")
        return False, []

def test_get_specific_order(order_id):
    """Test GET /api/orders/{order_id} - get specific order"""
    print(f"\n🧪 Testing Get Specific Order API (ID: {order_id})...")
    
    if not order_id:
        print("⚠️ No order ID provided, skipping specific order test")
        return True
    
    try:
        response = requests.get(f"{BACKEND_URL}/orders/{order_id}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            order = response.json()
            print(f"Order ID: {order.get('id')}")
            print(f"Customer: {order.get('customer_name')}")
            print(f"Total: ${order.get('total_amount')}")
            
            if order.get('id') == order_id:
                print("✅ Get specific order API working correctly")
                return True
            else:
                print("❌ Get specific order API returned wrong order")
                return False
        elif response.status_code == 404:
            print("❌ Order not found - this might indicate a database storage issue")
            return False
        else:
            print(f"❌ Get specific order API failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get specific order API error: {str(e)}")
        return False

def test_analytics():
    """Test GET /api/analytics - analytics data"""
    print("\n🧪 Testing Analytics API...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/analytics")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            analytics = response.json()
            print(f"Analytics data: {analytics}")
            
            # Check required fields
            required_fields = ['total_orders', 'popular_items', 'total_revenue']
            has_required_fields = all(field in analytics for field in required_fields)
            
            if has_required_fields:
                print(f"Total Orders: {analytics['total_orders']}")
                print(f"Total Revenue: ${analytics['total_revenue']}")
                print(f"Popular Items: {len(analytics['popular_items'])}")
                print("✅ Analytics API working correctly")
                return True
            else:
                print("❌ Analytics API missing required fields")
                return False
        else:
            print(f"❌ Analytics API failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Analytics API error: {str(e)}")
        return False

def create_additional_test_orders():
    """Create additional test orders for better analytics testing"""
    print("\n🧪 Creating Additional Test Orders for Analytics...")
    
    test_orders = [
        {
            "customer_name": "Michael Chen",
            "customer_email": "michael.chen@email.com",
            "customer_phone": "555-0234",
            "pickup_time": (datetime.now() + timedelta(hours=3)).isoformat(),
            "special_requests": "No nuts please",
            "total_amount": 8.75,
            "items": [
                {"id": "item1", "name": "Artisan Croissants", "price": 3.50, "quantity": 1, "category": "bakery"},
                {"id": "item2", "name": "Cappuccino", "price": 4.25, "quantity": 1, "category": "cafe"}
            ]
        },
        {
            "customer_name": "Emma Rodriguez",
            "customer_email": "emma.rodriguez@email.com", 
            "customer_phone": "555-0345",
            "pickup_time": (datetime.now() + timedelta(hours=4)).isoformat(),
            "special_requests": "Extra hot coffee please",
            "total_amount": 12.00,
            "items": [
                {"id": "item1", "name": "French Macarons", "price": 2.75, "quantity": 2, "category": "bakery"},
                {"id": "item2", "name": "Caramel Macchiato", "price": 5.25, "quantity": 1, "category": "cafe"},
                {"id": "item3", "name": "Cinnamon Danish", "price": 4.00, "quantity": 1, "category": "bakery"}
            ]
        }
    ]
    
    created_orders = 0
    for order_data in test_orders:
        try:
            response = requests.post(f"{BACKEND_URL}/orders", json=order_data)
            if response.status_code == 200:
                created_orders += 1
                print(f"✅ Created order for {order_data['customer_name']}")
            else:
                print(f"❌ Failed to create order for {order_data['customer_name']}")
        except Exception as e:
            print(f"❌ Error creating order for {order_data['customer_name']}: {str(e)}")
    
    print(f"Created {created_orders} additional test orders")
    return created_orders > 0

def main():
    """Run all backend API tests"""
    print("🚀 Starting Backend API Testing for Bakery Website")
    print("=" * 60)
    
    test_results = {}
    
    # Test API Root
    test_results['api_root'] = test_api_root()
    
    # Test Menu APIs
    test_results['menu_all'], menu_data = test_menu_all_items()
    test_results['menu_category'] = test_menu_by_category()
    
    # Test Order APIs
    test_results['create_order'], created_order_id = test_create_order()
    test_results['get_all_orders'], all_orders = test_get_all_orders()
    test_results['get_specific_order'] = test_get_specific_order(created_order_id)
    
    # Create additional orders for better analytics
    create_additional_test_orders()
    
    # Test Analytics
    test_results['analytics'] = test_analytics()
    
    # Summary
    print("\n" + "=" * 60)
    print("🏁 BACKEND API TEST SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(test_results.values())
    total_tests = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All backend API tests PASSED!")
        return True
    else:
        print("⚠️ Some backend API tests FAILED!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)