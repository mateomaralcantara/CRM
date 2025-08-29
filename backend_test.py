#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class CRMAPITester:
    def __init__(self, base_url="https://member-admin-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        self.tests_run = 0
        self.tests_passed = 0
        self.created_contact_id = None
        self.created_lead_id = None
        self.created_deal_id = None
        self.created_activity_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request and return response"""
        url = f"{self.api_url}/{endpoint}"
        headers = self.headers.copy()
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return None, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            if success:
                try:
                    return response.json(), None
                except:
                    return {"message": "success"}, None
            else:
                return None, f"Status {response.status_code}, expected {expected_status}. Response: {response.text[:200]}"

        except Exception as e:
            return None, f"Request failed: {str(e)}"

    def test_health_check(self):
        """Test health endpoint"""
        data, error = self.make_request('GET', 'health')
        success = data is not None and 'status' in data
        return self.log_test("Health Check", success, error or f"Status: {data.get('status') if data else 'None'}")

    def test_register_user(self):
        """Test user registration"""
        test_user = {
            "name": "Test User",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@crm.com",
            "password": "testpass123",
            "role": "user"
        }
        
        data, error = self.make_request('POST', 'auth/register', test_user, 200)
        success = data is not None and 'id' in data and 'email' in data
        return self.log_test("User Registration", success, error or f"User ID: {data.get('id') if data else 'None'}")

    def test_login(self):
        """Test user login with demo credentials"""
        login_data = {
            "email": "demo@crm.com",
            "password": "password123"
        }
        
        data, error = self.make_request('POST', 'auth/login', login_data, 200)
        success = data is not None and 'access_token' in data
        
        if success:
            self.token = data['access_token']
            self.headers['Authorization'] = f'Bearer {self.token}'
        
        return self.log_test("User Login", success, error or f"Token received: {'Yes' if self.token else 'No'}")

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        data, error = self.make_request('GET', 'dashboard')
        success = (data is not None and 
                  'total_contacts' in data and 
                  'total_leads' in data and 
                  'total_deals' in data and
                  'total_revenue' in data)
        
        details = ""
        if success:
            details = f"Contacts: {data['total_contacts']}, Leads: {data['total_leads']}, Deals: {data['total_deals']}, Revenue: ${data['total_revenue']}"
        
        return self.log_test("Dashboard Stats", success, error or details)

    def test_create_contact(self):
        """Test creating a new contact"""
        contact_data = {
            "first_name": "Test",
            "last_name": "Contact",
            "email": f"test.contact.{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "+34 123 456 789",
            "company": "Test Company",
            "job_title": "Test Manager",
            "address": "Test Address 123",
            "notes": "Test contact created by automated test"
        }
        
        data, error = self.make_request('POST', 'contacts', contact_data, 200)
        success = data is not None and 'id' in data and data['first_name'] == contact_data['first_name']
        
        if success:
            self.created_contact_id = data['id']
        
        return self.log_test("Create Contact", success, error or f"Contact ID: {self.created_contact_id}")

    def test_get_contacts(self):
        """Test retrieving all contacts"""
        data, error = self.make_request('GET', 'contacts')
        success = data is not None and isinstance(data, list)
        
        details = f"Found {len(data)} contacts" if success else error
        return self.log_test("Get Contacts", success, details)

    def test_get_single_contact(self):
        """Test retrieving a single contact"""
        if not self.created_contact_id:
            return self.log_test("Get Single Contact", False, "No contact ID available")
        
        data, error = self.make_request('GET', f'contacts/{self.created_contact_id}')
        success = data is not None and data['id'] == self.created_contact_id
        
        return self.log_test("Get Single Contact", success, error or f"Retrieved contact: {data.get('first_name', 'Unknown') if data else 'None'}")

    def test_update_contact(self):
        """Test updating a contact"""
        if not self.created_contact_id:
            return self.log_test("Update Contact", False, "No contact ID available")
        
        update_data = {
            "first_name": "Updated",
            "last_name": "Contact",
            "email": f"updated.contact.{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "+34 987 654 321",
            "company": "Updated Company",
            "job_title": "Updated Manager",
            "address": "Updated Address 456",
            "notes": "Updated contact by automated test"
        }
        
        data, error = self.make_request('PUT', f'contacts/{self.created_contact_id}', update_data, 200)
        success = data is not None and data['first_name'] == 'Updated'
        
        return self.log_test("Update Contact", success, error or f"Updated name: {data.get('first_name', 'Unknown') if data else 'None'}")

    def test_create_lead(self):
        """Test creating a new lead"""
        if not self.created_contact_id:
            return self.log_test("Create Lead", False, "No contact ID available")
        
        lead_data = {
            "contact_id": self.created_contact_id,
            "source": "website",
            "status": "new",
            "score": 75,
            "notes": "Test lead created by automated test"
        }
        
        data, error = self.make_request('POST', 'leads', lead_data, 200)
        success = data is not None and 'id' in data and data['contact_id'] == self.created_contact_id
        
        if success:
            self.created_lead_id = data['id']
        
        return self.log_test("Create Lead", success, error or f"Lead ID: {self.created_lead_id}")

    def test_get_leads(self):
        """Test retrieving all leads"""
        data, error = self.make_request('GET', 'leads')
        success = data is not None and isinstance(data, list)
        
        details = f"Found {len(data)} leads" if success else error
        return self.log_test("Get Leads", success, details)

    def test_update_lead_status(self):
        """Test updating lead status"""
        if not self.created_lead_id:
            return self.log_test("Update Lead Status", False, "No lead ID available")
        
        update_data = {
            "contact_id": self.created_contact_id,
            "source": "website",
            "status": "qualified",
            "score": 85,
            "notes": "Lead qualified by automated test"
        }
        
        data, error = self.make_request('PUT', f'leads/{self.created_lead_id}', update_data, 200)
        success = data is not None and data['status'] == 'qualified'
        
        return self.log_test("Update Lead Status", success, error or f"New status: {data.get('status', 'Unknown') if data else 'None'}")

    def test_create_deal(self):
        """Test creating a new deal"""
        if not self.created_contact_id:
            return self.log_test("Create Deal", False, "No contact ID available")
        
        deal_data = {
            "contact_id": self.created_contact_id,
            "title": "Test Deal",
            "value": 5000.0,
            "pipeline_stage": "prospecting",
            "probability": 25,
            "notes": "Test deal created by automated test"
        }
        
        data, error = self.make_request('POST', 'deals', deal_data, 200)
        success = data is not None and 'id' in data and data['title'] == deal_data['title']
        
        if success:
            self.created_deal_id = data['id']
        
        return self.log_test("Create Deal", success, error or f"Deal ID: {self.created_deal_id}")

    def test_get_deals(self):
        """Test retrieving all deals"""
        data, error = self.make_request('GET', 'deals')
        success = data is not None and isinstance(data, list)
        
        details = f"Found {len(data)} deals" if success else error
        return self.log_test("Get Deals", success, details)

    def test_create_activity(self):
        """Test creating a new activity"""
        if not self.created_contact_id:
            return self.log_test("Create Activity", False, "No contact ID available")
        
        activity_data = {
            "contact_id": self.created_contact_id,
            "type": "call",
            "title": "Test Call",
            "description": "Test call created by automated test",
            "completed": False
        }
        
        data, error = self.make_request('POST', 'activities', activity_data, 200)
        success = data is not None and 'id' in data and data['title'] == activity_data['title']
        
        return self.log_test("Create Activity", success, error or f"Activity created: {data.get('title', 'Unknown') if data else 'None'}")

    def test_get_activities(self):
        """Test retrieving all activities"""
        data, error = self.make_request('GET', 'activities')
        success = data is not None and isinstance(data, list)
        
        details = f"Found {len(data)} activities" if success else error
        return self.log_test("Get Activities", success, details)

    def test_search_functionality(self):
        """Test search functionality"""
        data, error = self.make_request('GET', 'search?q=Test&type=all')
        success = (data is not None and 
                  'contacts' in data and 
                  'leads' in data and 
                  'deals' in data)
        
        details = ""
        if success:
            details = f"Found - Contacts: {len(data['contacts'])}, Leads: {len(data['leads'])}, Deals: {len(data['deals'])}"
        
        return self.log_test("Search Functionality", success, error or details)

    def cleanup_test_data(self):
        """Clean up created test data"""
        cleanup_results = []
        
        # Delete created contact (this should cascade to leads)
        if self.created_contact_id:
            data, error = self.make_request('DELETE', f'contacts/{self.created_contact_id}', expected_status=200)
            cleanup_results.append(f"Contact cleanup: {'Success' if data else 'Failed'}")
        
        return cleanup_results

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting CRM API Tests...")
        print(f"📍 Testing endpoint: {self.api_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_health_check,
            self.test_register_user,
            self.test_login,
            self.test_dashboard_stats,
            self.test_create_contact,
            self.test_get_contacts,
            self.test_get_single_contact,
            self.test_update_contact,
            self.test_create_lead,
            self.test_get_leads,
            self.test_update_lead_status,
            self.test_create_deal,
            self.test_get_deals,
            self.test_create_activity,
            self.test_get_activities,
            self.test_search_functionality
        ]
        
        # Run tests
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, f"Exception: {str(e)}")
        
        # Cleanup
        print("\n🧹 Cleaning up test data...")
        cleanup_results = self.cleanup_test_data()
        for result in cleanup_results:
            print(f"   {result}")
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    """Main function"""
    tester = CRMAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())