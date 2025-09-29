const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔍 Testing login with correct credentials...');
    
    // Try login with the API
    console.log('\n🔐 Attempting API login...');
    const loginResponse = await axios.post('http://localhost:3003/api/auth/login', {
      email: 'philip.oppenlaender@ruhr-uni-bochum.de',
      password: '27101997pP%'
    });
    
    console.log('✅ Login successful!');
    console.log('User data:', loginResponse.data.user);
    console.log('Token received:', !!loginResponse.data.token);
    
    // Now test the /me endpoint
    console.log('\n2. Testing /api/auth/me with token...');
    const meResponse = await axios.get('http://localhost:3003/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    
    console.log('Me response:', {
      status: meResponse.status,
      user: meResponse.data
    });
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testLogin();