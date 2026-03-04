import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Configuration
const API_BASE_URL = 'http://10.20.14.148:5000';
const TEST_USER = {
  firstName: 'Test',
  lastName: 'User',
  email: `testuser_${Date.now()}@test.com`,
  password: 'Test@1234',
  role: 'AGENT_BUREAU_ORDRE',
  airport: 'TUN',
  phoneNumber: '12345678',
  position: 'Test Position'
};

// 1. Login as admin
async function loginAsAdmin() {
  try {
    console.log('🔑 Logging in as admin...');
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@tav.aero',
      password: 'Admin@1234' // Please use the correct admin password
    });
    
    console.log('✅ Successfully logged in as admin');
    return response.data.token;
  } catch (error) {
    console.error('❌ Error logging in as admin:', error.response?.data || error.message);
    process.exit(1);
  }
}

// 2. Create a test user
async function createTestUser(token) {
  try {
    console.log('👤 Creating test user...');
    const response = await axios.post(
      `${API_BASE_URL}/api/users`,
      TEST_USER,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Test user created successfully');
    console.log('   User ID:', response.data.userId);
    console.log('   Email sent to:', response.data.email);
    
    return response.data.userId;
  } catch (error) {
    console.error('❌ Error creating test user:', error.response?.data || error.message);
    process.exit(1);
  }
}

// 3. Get user details
async function getUserDetails(userId, token) {
  try {
    console.log('🔍 Getting user details...');
    const response = await axios.get(
      `${API_BASE_URL}/api/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('\n📋 User Details:');
    console.log('   Name:', response.data.firstName, response.data.lastName);
    console.log('   Email:', response.data.email);
    console.log('   Role:', response.data.role);
    console.log('   Status:', response.data.isActive ? 'Active' : 'Inactive');
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting user details:', error.response?.data || error.message);
    return null;
  }
}

// Main function
async function testUserCreation() {
  console.log('🚀 Starting user creation test...\n');
  
  // 1. Login as admin
  const token = await loginAsAdmin();
  
  // 2. Create a test user
  const userId = await createTestUser(token);
  
  // 3. Get user details
  await getUserDetails(userId, token);
  
  console.log('\n🎉 Test completed successfully!');
  console.log(`🔗 Frontend URL: http://10.20.14.148:8080`);
  console.log(`👤 Test user email: ${TEST_USER.email}`);
  console.log('🔑 Password: Test@1234');
}

// Run the test
testUserCreation().catch(console.error);
