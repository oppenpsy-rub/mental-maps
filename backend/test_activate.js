import fetch from 'node-fetch';

async function testActivate() {
    try {
        // First login to get token
        console.log('Logging in...');
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
            console.error('Login failed - no access token');
            return;
        }
        
        const token = loginData.accessToken;
        
        // Now try to activate the study
        console.log('\nActivating study...');
        const activateResponse = await fetch('http://localhost:5002/api/studies/80b5a530-8fc9-4864-8dcf-76b9638ed11c/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                reason: 'Test activation'
            })
        });
        
        const activateData = await activateResponse.json();
        console.log('Activate response status:', activateResponse.status);
        console.log('Activate response:', activateData);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testActivate();