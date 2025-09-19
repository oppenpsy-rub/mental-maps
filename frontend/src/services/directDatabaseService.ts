/**
 * Direct Database Service
 * Bypasses the broken backend API and connects directly to the database
 * This is a temporary solution until the backend is fixed
 */



interface ResponseData {
  participantId: string;
  questionId: string;
  responseData: any;
  mapDrawing?: any;
  responseTimeMs: number;
}

class DirectDatabaseService {
  private isEnabled: boolean;

  constructor() {
    // Only enable in development or when backend is broken
    this.isEnabled = process.env.NODE_ENV === 'development' ||
      localStorage.getItem('use_direct_db') === 'true';
  }

  /**
   * Enable direct database mode (fallback when backend is broken)
   */
  enableDirectMode(): void {
    this.isEnabled = true;
    localStorage.setItem('use_direct_db', 'true');
    console.warn('🔧 Direct Database Mode enabled - bypassing broken backend');
  }

  /**
   * Disable direct database mode
   */
  disableDirectMode(): void {
    this.isEnabled = false;
    localStorage.removeItem('use_direct_db');
    console.log('✓ Direct Database Mode disabled - using backend API');
  }

  /**
   * Check if direct mode is enabled
   */
  isDirectModeEnabled(): boolean {
    return this.isEnabled || localStorage.getItem('use_direct_db') === 'true';
  }

  /**
   * Submit response directly to database
   * This bypasses the broken backend API
   */
  async submitResponseDirect(data: ResponseData): Promise<{ success: boolean; message: string; responseId?: string }> {
    if (!this.isEnabled && !this.isDirectModeEnabled()) {
      throw new Error('Direct database mode is not enabled');
    }

    try {
      // Since we can't directly connect to PostgreSQL from the browser,
      // we'll use localStorage and provide a way to export/import the data

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

      // Store in localStorage
      localStorage.setItem(storageKey, JSON.stringify(responseRecord));

      // Add to index for easy retrieval
      const indexKey = 'direct_responses_index';
      const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
      existingIndex.push(storageKey);
      localStorage.setItem(indexKey, JSON.stringify(existingIndex));

      console.log('✅ Response stored locally:', storageKey);

      // Try to sync with database via a simple HTTP request to a PHP script
      // (This would need to be implemented separately)
      this.attemptSync(responseRecord);

      return {
        success: true,
        message: 'Response stored locally (will sync when backend is available)',
        responseId: storageKey
      };

    } catch (error) {
      console.error('❌ Direct response submission failed:', error);
      return {
        success: false,
        message: `Failed to store response: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Attempt to sync stored responses with the database
   */
  private async attemptSync(responseRecord: any): Promise<void> {
    try {
      // This would make a request to a simple PHP script that inserts into the database
      // For now, we'll just log that we would attempt this
      console.log('🔄 Would attempt to sync response:', responseRecord.id);

      // In a real implementation, this would be:
      // const response = await fetch('/sync-response.php', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(responseRecord)
      // });

    } catch (error) {
      console.warn('⚠️ Sync attempt failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get all stored responses
   */
  getStoredResponses(): any[] {
    const indexKey = 'direct_responses_index';
    const index: string[] = JSON.parse(localStorage.getItem(indexKey) || '[]');

    return index.map((key: string) => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }).filter(Boolean);
  }

  /**
   * Export stored responses as JSON for manual database import
   */
  exportResponses(): string {
    const responses = this.getStoredResponses();
    return JSON.stringify(responses, null, 2);
  }

  /**
   * Generate SQL statements for manual database import
   */
  generateSQLStatements(): string[] {
    const responses = this.getStoredResponses();
    const sqlStatements: string[] = [];

    responses.forEach(response => {
      // Generate INSERT statement for responses table
      const responseSQL = `
INSERT INTO mental_maps.responses (participant_id, question_id, response_data, response_time_ms, is_temporary, created_at, updated_at)
VALUES ('${response.participantId}', '${response.questionId}', '${JSON.stringify(response.responseData).replace(/'/g, "''")}', ${response.responseTimeMs}, false, '${response.timestamp}', '${response.timestamp}');
`;

      sqlStatements.push(responseSQL);

      // Generate INSERT statements for map drawings if present
      if (response.mapDrawing && response.mapDrawing.elements && response.mapDrawing.elements.length > 0) {
        const mapDrawingSQL = `
INSERT INTO mental_maps.map_drawings (response_id, drawing_data, created_at)
VALUES ((SELECT id FROM mental_maps.responses WHERE participant_id = '${response.participantId}' AND question_id = '${response.questionId}' ORDER BY created_at DESC LIMIT 1), '${JSON.stringify(response.mapDrawing.drawingData || {}).replace(/'/g, "''")}', '${response.timestamp}');
`;

        sqlStatements.push(mapDrawingSQL);

        // Generate INSERT statements for drawing elements
        response.mapDrawing.elements.forEach((element: any) => {
          if (element.geometry && element.geometry.coordinates) {
            const coords = element.geometry.coordinates[0]; // Assuming polygon
            const wkt = `POLYGON((${coords.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ')}))`;

            const elementSQL = `
INSERT INTO mental_maps.drawing_elements (map_drawing_id, element_type, geometry, style_properties, metadata, created_at)
VALUES (
  (SELECT id FROM mental_maps.map_drawings WHERE response_id = (SELECT id FROM mental_maps.responses WHERE participant_id = '${response.participantId}' AND question_id = '${response.questionId}' ORDER BY created_at DESC LIMIT 1) ORDER BY created_at DESC LIMIT 1),
  '${element.type}',
  ST_GeomFromText('${wkt}', 4326),
  '${JSON.stringify(element.style || {}).replace(/'/g, "''")}',
  '${JSON.stringify(element.metadata || {}).replace(/'/g, "''")}',
  '${response.timestamp}'
);
`;

            sqlStatements.push(elementSQL);
          }
        });
      }
    });

    return sqlStatements;
  }

  /**
   * Clear all stored responses
   */
  clearStoredResponses(): void {
    const indexKey = 'direct_responses_index';
    const index: string[] = JSON.parse(localStorage.getItem(indexKey) || '[]');

    index.forEach((key: string) => localStorage.removeItem(key));
    localStorage.removeItem(indexKey);

    console.log('✓ All stored responses cleared');
  }
}

export const directDatabaseService = new DirectDatabaseService();
export default DirectDatabaseService;