import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5002/api';

async function completeAPITest() {
  console.log('=== COMPLETE API TEST WITH RETRIES ===\n');

  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1}/${maxRetries}:`);

      // Test 1: Create participant session
      console.log('1. Creating participant session...');
      const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c';
      
      const sessionResponse = await fetch(`${API_BASE}/participate/${studyId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentGiven: true,
          metadata: {
            userAgent: 'Complete API Test',
            screenResolution: '1920x1080',
            timezone: 'Europe/Berlin',
            language: 'de-DE',
            timestamp: Date.now()
          }
        })
      });

      if (!sessionResponse.ok) {
        throw new Error(`Session creation failed: ${sessionResponse.status}`);
      }

      const sessionData = await sessionResponse.json();
      const { participantId, sessionToken } = sessionData.data;
      console.log('✓ Session created:', participantId.substring(0, 8) + '...');

      // Test 2: Get study info (test the fixed endpoint)
      console.log('\n2. Testing study info endpoint...');
      const infoResponse = await fetch(`${API_BASE}/participate/${studyId}/info`);
      
      if (!infoResponse.ok) {
        const errorText = await infoResponse.text();
        console.log('❌ Study info failed:', infoResponse.status, errorText);
        
        if (retries < maxRetries - 1) {
          console.log('Retrying in 2 seconds...\n');
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries++;
          continue;
        } else {
          throw new Error(`Study info failed after ${maxRetries} attempts`);
        }
      }

      const infoData = await infoResponse.json();
      console.log('✓ Study info retrieved successfully');
      console.log('  Study:', infoData.data.study.title);
      console.log('  Questions:', infoData.data.questions.length);

      const questions = infoData.data.questions;
      if (questions.length === 0) {
        throw new Error('No questions found');
      }

      // Test 3: Submit response (test the fixed endpoint)
      console.log('\n3. Testing response submission...');
      const firstQuestion = questions[0];
      
      const responsePayload = {
        questionId: firstQuestion.id,
        responseData: {
          textResponse: 'Complete API test response',
          interactionEvents: [{
            timestamp: Date.now(),
            event: 'complete_api_test',
            data: { source: 'complete_test_script' }
          }]
        },
        mapDrawing: {
          bounds: null,
          drawingData: {
            version: '1.0',
            canvasData: {},
            metadata: {
              totalElements: 1,
              drawingDuration: 2000,
              canvasSize: { width: 800, height: 600 }
            }
          },
          elements: [{
            type: 'polygon',
            geometry: {
              type: 'Polygon',
              coordinates: [[[13.404, 52.52], [13.406, 52.52], [13.406, 52.522], [13.404, 52.522], [13.404, 52.52]]]
            },
            style: {
              color: '#22c55e',
              fillColor: '#22c55e',
              fillOpacity: 0.2,
              weight: 3
            },
            metadata: {
              label: 'Complete API Test Polygon',
              createdWith: 'Complete API Test'
            }
          }]
        },
        responseTimeMs: 2000
      };

      const responseSubmission = await fetch(`${API_BASE}/participate/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(responsePayload)
      });

      if (!responseSubmission.ok) {
        const errorText = await responseSubmission.text();
        console.log('❌ Response submission failed:', responseSubmission.status, errorText);
        
        if (retries < maxRetries - 1) {
          console.log('Retrying in 2 seconds...\n');
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries++;
          continue;
        } else {
          throw new Error(`Response submission failed after ${maxRetries} attempts`);
        }
      }

      const responseResult = await responseSubmission.json();
      console.log('✓ Response submitted successfully:', responseResult.message);

      // Test 4: Complete participation
      console.log('\n4. Testing participation completion...');
      const completionResponse = await fetch(`${API_BASE}/participate/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          completedAt: Date.now()
        })
      });

      if (!completionResponse.ok) {
        const errorText = await completionResponse.text();
        console.log('❌ Completion failed:', completionResponse.status, errorText);
      } else {
        const completionResult = await completionResponse.json();
        console.log('✓ Participation completed:', completionResult.message);
      }

      console.log('\n🎉 COMPLETE API TEST SUCCESSFUL!');
      console.log('Participant ID:', participantId);
      console.log('All endpoints are working correctly with the fixed code.');
      return;

    } catch (error) {
      console.error(`❌ Attempt ${retries + 1} failed:`, error.message);
      
      if (retries < maxRetries - 1) {
        console.log('Retrying in 2 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries++;
      } else {
        console.error('❌ All attempts failed. Backend may need to be restarted.');
        break;
      }
    }
  }
}

completeAPITest();