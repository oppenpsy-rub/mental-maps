import fetch from 'node-fetch';

async function testMapConfigAPI() {
    try {
        // First login to get token
        console.log('1. Logging in...');
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
        const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c';
        
        // Get current study
        console.log('2. Getting current study...');
        const getResponse = await fetch(`http://localhost:5002/api/studies/${studyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const studyData = await getResponse.json();
        console.log('Current study settings:', JSON.stringify(studyData.data?.settings, null, 2));
        
        // Update study with new map configuration
        console.log('3. Updating study with new map configuration...');
        const newMapConfig = {
            center: [52.5200, 13.4050], // Berlin
            initialZoom: 10,
            minZoom: 5,
            maxZoom: 15,
            mapStyle: 'satellite',
            enabledTools: ['pen', 'line', 'circle']
        };
        
        const updateData = {
            settings: {
                ...studyData.data.settings,
                mapConfiguration: newMapConfig
            }
        };
        
        console.log('Sending update with:', JSON.stringify(updateData, null, 2));
        
        const updateResponse = await fetch(`http://localhost:5002/api/studies/${studyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        const updateResult = await updateResponse.json();
        console.log('Update response status:', updateResponse.status);
        console.log('Update result:', JSON.stringify(updateResult, null, 2));
        
        if (updateResponse.ok) {
            console.log('✓ Study updated successfully');
            
            // Verify the update by fetching again
            console.log('4. Verifying update by fetching study again...');
            const verifyResponse = await fetch(`http://localhost:5002/api/studies/${studyId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const verifyData = await verifyResponse.json();
            console.log('Verified study settings:', JSON.stringify(verifyData.data?.settings, null, 2));
            
            if (verifyData.data?.settings?.mapConfiguration) {
                console.log('✓ Map configuration found in database!');
                console.log('Map config:', JSON.stringify(verifyData.data.settings.mapConfiguration, null, 2));
                
                // Check if our changes were saved
                const savedConfig = verifyData.data.settings.mapConfiguration;
                if (savedConfig.center && savedConfig.center[0] === 52.5200 && savedConfig.center[1] === 13.4050) {
                    console.log('✓ Map configuration was saved correctly!');
                } else {
                    console.log('✗ Map configuration was not saved correctly');
                    console.log('Expected center: [52.5200, 13.4050]');
                    console.log('Actual center:', savedConfig.center);
                }
            } else {
                console.log('✗ No map configuration found in database');
            }
        } else {
            console.log('✗ Study update failed:', updateResult);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testMapConfigAPI();