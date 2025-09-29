const axios = require('axios');

async function debugAuth() {
  try {
    console.log('🔍 Testing /api/auth/me endpoint...');
    
    // First, let's try to login to get a token
    console.log('\n1. Attempting login...');
    const loginResponse = await axios.post('http://localhost:3003/api/auth/login', {
      email: 'philip.oppenlaender@ruhr-uni-bochum.de',
      password: 'test123' // You might need to adjust this
    });
    
    console.log('Login response:', {
      status: loginResponse.status,
      user: loginResponse.data.user,
      hasToken: !!loginResponse.data.token
    });
    
    const token = loginResponse.data.token;
    
    // Now test the /me endpoint
    console.log('\n2. Testing /api/auth/me with token...');
    const meResponse = await axios.get('http://localhost:3003/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Me response:', {
      status: meResponse.status,
      user: meResponse.data
    });
    
    console.log('\n✅ Auth debugging complete');
    
  } catch (error) {
    console.error('❌ Error during auth debugging:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

debugAuth();