// Test script to verify backend i18n functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testBackendI18n() {
  console.log('🔍 Testing Backend i18n Functionality\n');
  
  try {
    // Test 1: Login with French Accept-Language header
    console.log('1. Testing login with French Accept-Language header...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'philip.oppenlaender@ruhr-uni-bochum.de',
      password: '27101997pP%'
    }, {
      headers: {
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
      }
    });
    
    console.log('Login response message:', loginResponse.data.message);
    const token = loginResponse.data.token;
    
    // Test 2: Test authenticated request with French language
    console.log('\n2. Testing authenticated request with French language...');
    const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
      }
    });
    
    console.log('User language from database:', meResponse.data.language);
    
    // Test 3: Test with custom language header
    console.log('\n3. Testing with custom X-Language header...');
    const customHeaderResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Language': 'fr'
      }
    });
    
    console.log('Response with custom header:', customHeaderResponse.data);
    
    // Test 4: Test error response in French
    console.log('\n4. Testing error response in French...');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'invalid@email.com',
        password: 'wrongpassword'
      }, {
        headers: {
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
        }
      });
    } catch (error) {
      console.log('Error message in French:', error.response.data.message);
    }
    
    console.log('\n✅ Backend i18n tests completed!');
    
  } catch (error) {
    console.error('❌ Error during backend i18n testing:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testBackendI18n();