// Test script to simulate the fallback logic
console.log('🧪 Testing fallback logic...');

// Simulate localStorage
const localStorage = {
  data: {},
  setItem(key, value) {
    this.data[key] = value;
    console.log(`📝 localStorage.setItem: ${key} = ${value.substring(0, 100)}...`);
  },
  getItem(key) {
    return this.data[key] || null;
  },
  removeItem(key) {
    delete this.data[key];
  }
};

// Simulate DirectDatabaseService
class DirectDatabaseService {
  constructor() {
    this.isEnabled = false;
  }

  enableDirectMode() {
    this.isEnabled = true;
    localStorage.setItem('use_direct_db', 'true');
    console.log('🔧 Direct Database Mode enabled - bypassing broken backend');
  }

  isDirectModeEnabled() {
    return this.isEnabled || localStorage.getItem('use_direct_db') === 'true';
  }

  async submitResponseDirect(data) {
    console.log('💾 DirectDatabaseService.submitResponseDirect called with:', data);
    
    const storageKey = `direct_response_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const responseRecord = {
      id: storageKey,
      participantId: data.participantId,
      questionId: data.questionId,
      responseData: data.responseData,
      mapDrawing: data.mapDrawing,
      responseTimeMs: data.responseTimeMs,
      timestamp: new Date().toISOString(),
      synced: false
    };

    localStorage.setItem(storageKey, JSON.stringify(responseRecord));
    
    const indexKey = 'direct_responses_index';
    const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
    existingIndex.push(storageKey);
    localStorage.setItem(indexKey, JSON.stringify(existingIndex));

    console.log('✅ Response stored locally:', storageKey);
    
    return {
      success: true,
      message: 'Response stored locally (will sync when backend is available)',
      responseId: storageKey
    };
  }

  getStoredResponses() {
    const indexKey = 'direct_responses_index';
    const index = JSON.parse(localStorage.getItem(indexKey) || '[]');
    
    return index.map(key => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }).filter(Boolean);
  }
}

// Simulate SessionService
class SessionService {
  getCurrentSession() {
    return {
      participantId: 'test_participant_12345',
      studyId: 'test_study_67890'
    };
  }
}

// Simulate ParticipantService
class ParticipantService {
  constructor() {
    this.baseUrl = 'http://localhost:5002/api';
    this.directDatabaseService = new DirectDatabaseService();
    this.sessionService = new SessionService();
  }

  async submitResponse(sessionToken, request) {
    console.log('🔍 ParticipantService.submitResponse called with:', {
      token: sessionToken?.substring(0, 20) + '...',
      questionId: request.questionId,
      hasDrawingData: !!request.drawingData
    });

    try {
      console.log('📡 Attempting backend submission...');
      
      // Simulate backend failure
      const simulateBackendError = true;
      
      if (simulateBackendError) {
        console.log('📡 Backend response status: 500');
        console.error('❌ Backend submission failed:', 500, { message: 'Internal server error' });
        
        // If backend is broken, enable direct database mode
        console.warn('🔧 Backend response submission failed, switching to direct mode');
        this.directDatabaseService.enableDirectMode();
        
        // Extract participant ID from session
        const participantId = this.extractParticipantIdFromToken(sessionToken);
        console.log('🔧 Using participant ID:', participantId);
        
        const directResult = await this.directDatabaseService.submitResponseDirect({
          participantId: participantId,
          questionId: request.questionId,
          responseData: request.responseData,
          mapDrawing: request.drawingData,
          responseTimeMs: request.metadata?.responseTime || 0
        });
        
        console.log('✅ Direct submission result:', directResult);
        return directResult;
      }

      console.log('✅ Backend submission successful');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Network/fetch error:', error);
      
      // Network error - also try direct mode
      console.warn('🔧 Network error, trying direct database mode');
      this.directDatabaseService.enableDirectMode();
      
      try {
        const participantId = this.extractParticipantIdFromToken(sessionToken);
        console.log('🔧 Using participant ID for network fallback:', participantId);
        
        const directResult = await this.directDatabaseService.submitResponseDirect({
          participantId: participantId,
          questionId: request.questionId,
          responseData: request.responseData,
          mapDrawing: request.drawingData,
          responseTimeMs: request.metadata?.responseTime || 0
        });
        
        console.log('✅ Direct submission after network error:', directResult);
        return directResult;
        
      } catch (directError) {
        console.error('❌ Both backend and direct submission failed:', directError);
        throw new Error('Both backend and direct database submission failed');
      }
    }
  }

  extractParticipantIdFromToken(token) {
    // Try to get from session service first
    const stored = this.sessionService.getCurrentSession();
    if (stored && stored.participantId) {
      return stored.participantId;
    }
    
    // Fallback: generate a temporary ID based on token
    const tempId = `participant_${token.substring(0, 8)}_${Date.now()}`;
    console.warn('⚠️ Using temporary participant ID:', tempId);
    return tempId;
  }
}

// Test the fallback logic
async function testFallback() {
  console.log('\n=== TESTING FALLBACK LOGIC ===\n');
  
  const participantService = new ParticipantService();
  
  const testRequest = {
    questionId: 'test_question_123',
    responseType: 'map_drawing',
    responseData: { answer: 'This is a test response' },
    drawingData: { 
      elements: [
        { type: 'circle', coordinates: [46.5, 6.5], style: { color: 'red' } }
      ]
    },
    metadata: {
      responseTime: 5000,
      deviceInfo: { userAgent: 'test' },
      timestamp: Date.now()
    }
  };
  
  try {
    const result = await participantService.submitResponse('test_token_abcdef123456', testRequest);
    console.log('\n🎉 Final result:', result);
    
    // Check stored responses
    const storedResponses = participantService.directDatabaseService.getStoredResponses();
    console.log('\n📊 Stored responses:', storedResponses.length);
    storedResponses.forEach((response, index) => {
      console.log(`  ${index + 1}. ${response.id} - ${response.timestamp}`);
    });
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testFallback();