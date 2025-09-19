import fetch from 'node-fetch';

async function testMentalMapsAPI() {
  try {
    // First login to get token
    console.log('=== Logging in ===');
    const loginResponse = await fetch('http://localhost:5002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.accessToken) {
      throw new Error('Login failed');
    }

    const token = loginData.accessToken;

    // Test mental maps API
    console.log('\n=== Testing Mental Maps API ===');
    const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c'; // Your study ID
    
    const mentalMapsResponse = await fetch(`http://localhost:5002/api/responses/study/${studyId}/mental-maps`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const mentalMapsData = await mentalMapsResponse.json();
    console.log('Mental Maps API Response:', JSON.stringify(mentalMapsData, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

testMentalMapsAPI();