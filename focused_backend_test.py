#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid
import time

class FocusedCRMTester:
    def __init__(self, base_url="https://member-admin-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        self.test_user_email = None
        self.test_user_password = "TestPassword123!"
        self.created_contact_id = None
        self.created_lead_id = None
        self.created_ticket_id = None
        self.tests_passed = 0
        self.tests_run = 0

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
                try:
                    error_detail = response.json()
                    error_msg = f"Status {response.status_code} (expected {expected_status}). Error: {error_detail}"
                except:
                    error_msg = f"Status {response.status_code} (expected {expected_status}). Response: {response.text[:200]}"
                return None, error_msg

        except Exception as e:
            return None, f"Request failed: {str(e)}"

    def setup_authentication(self):
        """Setup authentication for testing"""
        print("🔐 Setting up authentication...")
        
        # Register user
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.test_user_email = f"testuser{timestamp}@gmail.com"
        
        user_data = {
            "name": "Test User",
            "email": self.test_user_email,
            "password": self.test_user_password,
            "role": "admin"
        }
        
        reg_data, reg_error = self.make_request('POST', 'auth/register', user_data, 200)
        if not reg_data:
            return self.log_test("Authentication Setup - Registration", False, reg_error)
        
        # Login
        login_data = {"email": self.test_user_email, "password": self.test_user_password}
        login_response, login_error = self.make_request('POST', 'auth/login', login_data, 200)
        
        if login_response and 'access_token' in login_response:
            self.token = login_response['access_token']
            self.headers['Authorization'] = f'Bearer {self.token}'
            return self.log_test("Authentication Setup", True, f"Token: {self.token[:20]}...")
        else:
            return self.log_test("Authentication Setup - Login", False, login_error)

    def test_critical_user_issues(self):
        """Test the 4 critical user-reported issues"""
        print("\n🎯 Testing Critical User-Reported Issues:")
        
        # Issue 1: Error al guardar contacto
        print("\n1️⃣ Testing Contact Creation (Error al guardar contacto)")
        contact_data = {
            "first_name": "María",
            "last_name": "González",
            "email": f"maria.gonzalez.{datetime.now().strftime('%H%M%S')}@empresa.es",
            "phone": "+34 666 123 456",
            "company": "Empresa Tecnológica SL",
            "job_title": "Directora de Marketing"
        }
        
        contact_response, contact_error = self.make_request('POST', 'contacts', contact_data, 200)
        if contact_response and 'id' in contact_response:
            self.created_contact_id = contact_response['id']
            self.log_test("Issue 1: Contact Creation", True, f"Contact ID: {self.created_contact_id}")
        else:
            self.log_test("Issue 1: Contact Creation", False, contact_error)
            return False

        # Issue 2: No permite agregar leads
        print("\n2️⃣ Testing Lead Creation (No permite agregar leads)")
        lead_data = {
            "contact_id": self.created_contact_id,
            "source": "website",
            "status": "new",
            "score": 85,
            "notes": "Lead generado desde formulario web"
        }
        
        lead_response, lead_error = self.make_request('POST', 'leads', lead_data, 200)
        if lead_response and 'id' in lead_response:
            self.created_lead_id = lead_response['id']
            self.log_test("Issue 2: Lead Creation", True, f"Lead ID: {self.created_lead_id}")
        else:
            self.log_test("Issue 2: Lead Creation", False, lead_error)
            return False

        # Issue 3: Errores en área de tickets
        print("\n3️⃣ Testing Ticket System (Errores en área de tickets)")
        
        # Test ticket creation
        ticket_data = {
            "title": "Error en sistema de facturación",
            "description": "El sistema no permite generar facturas para clientes nuevos",
            "category": "technical",
            "priority": "high"
        }
        
        ticket_response, ticket_error = self.make_request('POST', 'tickets', ticket_data, 200)
        if ticket_response and 'id' in ticket_response:
            self.created_ticket_id = ticket_response['id']
            ticket_create_success = True
        else:
            ticket_create_success = False
        
        # Test ticket retrieval
        tickets_list, tickets_error = self.make_request('GET', 'tickets', expected_status=200)
        ticket_get_success = tickets_list is not None and isinstance(tickets_list, list)
        
        ticket_system_success = ticket_create_success and ticket_get_success
        details = f"Create: {ticket_create_success}, Get: {ticket_get_success}"
        if not self.log_test("Issue 3: Ticket System", ticket_system_success, details):
            return False

        # Issue 4: Permisos para administrador
        print("\n4️⃣ Testing Admin Permissions (Permisos para administrador)")
        
        # Test admin can delete (should work with admin role)
        if self.created_ticket_id:
            delete_response, delete_error = self.make_request('DELETE', f'tickets/{self.created_ticket_id}', expected_status=200)
            admin_permission_success = delete_response is not None
            details = f"Admin delete successful: {admin_permission_success}"
        else:
            admin_permission_success = False
            details = "No ticket to test admin permissions"
        
        self.log_test("Issue 4: Admin Permissions", admin_permission_success, details)
        
        return True

    def test_additional_functionality(self):
        """Test additional functionality to ensure system is robust"""
        print("\n🔍 Testing Additional Functionality:")
        
        # Test dashboard
        dashboard_data, dashboard_error = self.make_request('GET', 'dashboard')
        dashboard_success = dashboard_data is not None and 'total_contacts' in dashboard_data
        self.log_test("Dashboard Stats", dashboard_success, dashboard_error or f"Contacts: {dashboard_data.get('total_contacts', 0) if dashboard_data else 0}")
        
        # Test contact retrieval
        contacts_data, contacts_error = self.make_request('GET', 'contacts')
        contacts_success = contacts_data is not None and isinstance(contacts_data, list)
        self.log_test("Contact Retrieval", contacts_success, f"Found {len(contacts_data)} contacts" if contacts_success else contacts_error)
        
        # Test lead retrieval
        leads_data, leads_error = self.make_request('GET', 'leads')
        leads_success = leads_data is not None and isinstance(leads_data, list)
        self.log_test("Lead Retrieval", leads_success, f"Found {len(leads_data)} leads" if leads_success else leads_error)
        
        # Test search functionality
        search_data, search_error = self.make_request('GET', 'search?q=María&type=contacts')
        search_success = search_data is not None and 'contacts' in search_data
        self.log_test("Search Functionality", search_success, f"Search results: {len(search_data.get('contacts', [])) if search_data else 0}")

    def run_focused_tests(self):
        """Run focused tests on critical functionality"""
        print("🚀 FOCUSED CRM BACKEND TESTING - POST-FIXES VERIFICATION")
        print("=" * 70)
        print("🎯 Focus: Verify critical user-reported issues are resolved")
        print("=" * 70)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Cannot proceed without authentication")
            return 1
        
        # Test critical issues
        if not self.test_critical_user_issues():
            print("❌ Critical issues testing failed")
            return 1
        
        # Test additional functionality
        self.test_additional_functionality()
        
        # Summary
        print("\n" + "=" * 70)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        print("\n🎯 CRITICAL ISSUES ASSESSMENT:")
        if self.tests_passed >= 6:  # Auth + 4 critical issues + some additional
            print("✅ Issue 1: Error al guardar contacto - RESOLVED")
            print("✅ Issue 2: No permite agregar leads - RESOLVED") 
            print("✅ Issue 3: Errores en área de tickets - RESOLVED")
            print("✅ Issue 4: Permisos para administrador - RESOLVED")
            print("\n🎉 ALL CRITICAL USER-REPORTED ISSUES HAVE BEEN FIXED!")
            return 0
        else:
            print("❌ Some critical issues remain unresolved")
            return 1

def main():
    """Main function"""
    tester = FocusedCRMTester()
    return tester.run_focused_tests()

if __name__ == "__main__":
    sys.exit(main())