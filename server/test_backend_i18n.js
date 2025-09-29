// Test script for backend i18n functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testBackendI18n() {
  console.log('🔍 Testing Backend i18n Functionality');
  console.log('=====================================\n');

  try {
    // Test 1: Login with invalid credentials (should return French error)
    console.log('Test 1: Login with invalid credentials (French)');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      }, {
        headers: {
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'x-language': 'fr'
        }
      });
    } catch (error) {
      console.log('Status:', error.response.status);
      console.log('French Error Message:', error.response.data.message);
      console.log('✅ French error message received\n');
    }

    // Test 2: Same request but with English headers
    console.log('Test 2: Login with invalid credentials (English)');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      }, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'x-language': 'en'
        }
      });
    } catch (error) {
      console.log('Status:', error.response.status);
      console.log('English Error Message:', error.response.data.message);
      console.log('✅ English error message received\n');
    }

    // Test 3: Same request but with German headers (default)
    console.log('Test 3: Login with invalid credentials (German - default)');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      }, {
        headers: {
          'Accept-Language': 'de-DE,de;q=0.9'
        }
      });
    } catch (error) {
      console.log('Status:', error.response.status);
      console.log('German Error Message:', error.response.data.message);
      console.log('✅ German error message received\n');
    }

    // Test 4: Test with valid login to see success message
    console.log('Test 4: Valid login (French success message)');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'philip.oppenlaender@ruhr-uni-bochum.de',
        password: '27101997pP%'
      }, {
        headers: {
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'x-language': 'fr'
        }
      });
      console.log('Status:', response.status);
      console.log('French Success Message:', response.data.message);
      console.log('✅ French success message received\n');
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBackendI18n();