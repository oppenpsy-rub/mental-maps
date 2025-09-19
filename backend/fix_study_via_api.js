import fetch from 'node-fetch';

async function fixStudyViaAPI() {
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
        
        if (!loginData.accessToken) {
            console.error('Login failed');
            return;
        }
        
        const token = loginData.accessToken;
        const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c';
        
        // Get current study
        console.log('Getting current study...');
        const getResponse = await fetch(`http://localhost:5002/api/studies/${studyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const studyData = await getResponse.json();
        console.log('Current study settings:', studyData.data?.settings);
        
        // Update study with map configuration
        console.log('Updating study with map configuration...');
        const updateData = {
            ...studyData.data,
            settings: {
                mapConfiguration: {
                    initialBounds: {
                        north: 52.5,
                        south: 52.4,
                        east: 13.5,
                        west: 13.3
                    },
                    initialZoom: 12,
                    minZoom: 8,
                    maxZoom: 18,
                    center: [52.45, 13.4],
                    mapStyle: 'standard',
                    enabledTools: ['pen', 'line', 'polygon', 'circle', 'text', 'heatmap'],
                    customLayers: []
                },
                participantSettings: {
                    allowSkipQuestions: false,
                    showProgressIndicator: true,
                    enableAutoSave: true,
                    autoSaveInterval: 30000
                },
                dataCollection: {
                    collectDrawingData: true,
                    collectInteractionData: true,
                    collectTimingData: true
                }
            }
        };
        
        const updateResponse = await fetch(`http://localhost:5002/api/studies/${studyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        const updateResult = await updateResponse.json();
        console.log('Update response:', updateResult);
        
        if (updateResponse.ok) {
            console.log('✓ Study updated successfully');
            
            // Now try to activate
            console.log('Trying to activate study...');
            const activateResponse = await fetch(`http://localhost:5002/api/studies/${studyId}/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    reason: 'Fixed map configuration'
                })
            });
            
            const activateResult = await activateResponse.json();
            console.log('Activate response:', activateResult);
            
            if (activateResponse.ok) {
                console.log('✓ Study activated successfully!');
            } else {
                console.log('✗ Study activation failed:', activateResult);
            }
        } else {
            console.log('✗ Study update failed:', updateResult);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

fixStudyViaAPI();