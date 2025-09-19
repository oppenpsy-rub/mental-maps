import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5002/api';

async function testResponseAPI() {
  console.log('=== TESTING RESPONSE SUBMISSION API ===\n');

  try {
    // Step 1: Create a participant session
    console.log('1. Creating participant session...');
    const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c'; // Use existing study
    
    const sessionResponse = await fetch(`${API_BASE}/participate/${studyId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentGiven: true,
        metadata: {
          userAgent: 'Test Script',
          screenResolution: '1920x1080',
          timezone: 'Europe/Berlin',
          language: 'de-DE',
          timestamp: Date.now()
        }
      })
    });

    if (!sessionResponse.ok) {
      throw new Error(`Session creation failed: ${sessionResponse.status} ${sessionResponse.statusText}`);
    }

    const sessionData = await sessionResponse.json();
    console.log('✓ Session created:', sessionData.data.participantId);
    console.log('✓ Session token:', sessionData.data.sessionToken.substring(0, 20) + '...');

    const { participantId, sessionToken } = sessionData.data;

    // Step 2: Get study questions
    console.log('\n2. Getting study questions...');
    const infoResponse = await fetch(`${API_BASE}/participate/${studyId}/info`);
    
    if (!infoResponse.ok) {
      throw new Error(`Info request failed: ${infoResponse.status} ${infoResponse.statusText}`);
    }
    
    const infoData = await infoResponse.json();
    console.log('Info response:', JSON.stringify(infoData, null, 2));
    
    if (!infoData.data || !infoData.data.questions) {
      throw new Error('No questions data in response');
    }
    
    const questions = infoData.data.questions;
    console.log(`✓ Found ${questions.length} questions`);

    if (questions.length === 0) {
      console.log('❌ No questions found - cannot test response submission');
      return;
    }

    const firstQuestion = questions[0];
    console.log(`✓ Testing with question: ${firstQuestion.questionText.substring(0, 50)}...`);

    // Step 3: Submit a test response
    console.log('\n3. Submitting test response...');
    const responsePayload = {
      questionId: firstQuestion.id,
      responseData: {
        textResponse: 'Test response from debug script',
        interactionEvents: [{
          timestamp: Date.now(),
          event: 'test_submission',
          data: { source: 'debug_script' }
        }]
      },
      mapDrawing: {
        bounds: null,
        drawingData: {
          version: '1.0',
          canvasData: {},
          metadata: {
            totalElements: 1,
            drawingDuration: 5000,
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
            label: 'Test Polygon',
            createdWith: 'Debug Script'
          }
        }]
      },
      responseTimeMs: 5000
    };

    const responseSubmission = await fetch(`${API_BASE}/participate/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify(responsePayload)
    });

    console.log('Response status:', responseSubmission.status);
    console.log('Response headers:', Object.fromEntries(responseSubmission.headers.entries()));

    if (!responseSubmission.ok) {
      const errorText = await responseSubmission.text();
      console.log('❌ Response submission failed:', errorText);
      return;
    }

    const responseResult = await responseSubmission.json();
    console.log('✓ Response submitted successfully:', responseResult);

    // Step 4: Submit demographic data
    console.log('\n4. Submitting demographic data...');
    const demographicData = {
      age: 25,
      gender: 'Test',
      education: 'bachelor',
      nativeLanguage: 'Deutsch'
    };

    const demographicSubmission = await fetch(`${API_BASE}/participate/demographics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        demographicData,
        timestamp: Date.now()
      })
    });

    if (!demographicSubmission.ok) {
      const errorText = await demographicSubmission.text();
      console.log('❌ Demographic submission failed:', errorText);
    } else {
      const demographicResult = await demographicSubmission.json();
      console.log('✓ Demographic data submitted:', demographicResult);
    }

    // Step 5: Complete participation
    console.log('\n5. Completing participation...');
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
      console.log('❌ Completion failed:', errorText);
    } else {
      const completionResult = await completionResponse.json();
      console.log('✓ Participation completed:', completionResult);
    }

    console.log('\n=== TEST COMPLETED ===');
    console.log('Participant ID:', participantId);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testResponseAPI();