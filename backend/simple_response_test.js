import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5002/api';

async function simpleTest() {
  console.log('=== SIMPLE API TEST ===\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server health...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    console.log('Health check status:', healthResponse.status);

    // Test 2: Get study info directly
    console.log('\n2. Testing study info endpoint...');
    const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c';
    
    const infoResponse = await fetch(`${API_BASE}/participate/${studyId}/info`);
    console.log('Study info status:', infoResponse.status);
    
    if (infoResponse.ok) {
      const infoData = await infoResponse.json();
      console.log('Study info response:', JSON.stringify(infoData, null, 2));
    } else {
      const errorText = await infoResponse.text();
      console.log('Study info error:', errorText);
    }

    // Test 3: Create session with minimal data
    console.log('\n3. Testing session creation...');
    const sessionResponse = await fetch(`${API_BASE}/participate/${studyId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentGiven: true,
        metadata: {
          timestamp: Date.now()
        }
      })
    });

    console.log('Session creation status:', sessionResponse.status);
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('Session created:', sessionData.data.participantId);
      
      // Test 4: Try to submit a minimal response
      console.log('\n4. Testing minimal response submission...');
      const { sessionToken } = sessionData.data;
      
      const responsePayload = {
        questionId: 'd21d4214-2494-4723-9f9e-2d9e0303d2d2', // Use known question ID
        responseData: {
          textResponse: 'Minimal test response'
        },
        responseTimeMs: 1000
      };

      const responseSubmission = await fetch(`${API_BASE}/participate/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(responsePayload)
      });

      console.log('Response submission status:', responseSubmission.status);
      
      if (responseSubmission.ok) {
        const result = await responseSubmission.json();
        console.log('✓ Response submitted successfully:', result);
      } else {
        const errorText = await responseSubmission.text();
        console.log('❌ Response submission failed:', errorText);
      }
    } else {
      const errorText = await sessionResponse.text();
      console.log('Session creation error:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleTest();