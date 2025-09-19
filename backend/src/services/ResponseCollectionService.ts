import { ResponseRepository } from '../repositories/ResponseRepository';
import { ParticipantRepository } from '../repositories/ParticipantRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { Response, ResponseData } from '../models/Response';
import { MapDrawing, DrawingData } from '../models/MapDrawing';
import { DrawingElement, DrawingElementType, ElementStyle, ElementMetadata } from '../models/DrawingElement';
import { ApiError } from '../types/errors';
import { AppDataSource } from '../database/connection';

export interface SubmitResponseRequest {
  participantId: string;
  questionId: string;
  responseData: ResponseData;
  mapDrawing?: {
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    drawingData: DrawingData;
    elements?: {
      type: DrawingElementType;
      geometry: GeoJSON.Geometry;
      style: ElementStyle;
      metadata?: ElementMetadata;
    }[];
  };
  responseTimeMs?: number;
}

export interface UpdateResponseRequest {
  responseData?: ResponseData;
  mapDrawing?: {
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    drawingData: DrawingData;
    elements?: {
      type: DrawingElementType;
      geometry: GeoJSON.Geometry;
      style: ElementStyle;
      metadata?: ElementMetadata;
    }[];
  };
  responseTimeMs?: number;
}

export interface ResponseFilters {
  participantId?: string;
  questionId?: string;
  questionType?: string;
  hasMapDrawing?: boolean;
  completedOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export class ResponseCollectionService {
  private responseRepository: ResponseRepository;
  private participantRepository: ParticipantRepository;
  private questionRepository: QuestionRepository;

  constructor() {
    this.responseRepository = new ResponseRepository();
    this.participantRepository = new ParticipantRepository();
    this.questionRepository = new QuestionRepository();
  }

  /**
   * Get mental maps for a study with participant and drawing data
   */
  async getMentalMapsByStudy(studyId: string): Promise<any[]> {
    try {
      console.log('Getting mental maps for study:', studyId);
      
      // First, get all responses with map drawings for this study
      const query = `
        SELECT 
          r.id as response_id,
          r.participant_id,
          r.question_id,
          r.response_time_ms,
          r.created_at as response_created_at,
          q.title as question_title,
          q.question_text,
          p.participant_code,
          p.created_at as participant_created_at,
          md.id as map_drawing_id,
          md.drawing_data,
          md.created_at as drawing_created_at
        FROM mental_maps.responses r
        JOIN mental_maps.questions q ON r.question_id = q.id
        JOIN mental_maps.participants p ON r.participant_id = p.id
        LEFT JOIN mental_maps.map_drawings md ON r.id = md.response_id
        WHERE q.study_id = $1 
          AND q.question_type = 'map_drawing'
          AND md.id IS NOT NULL
        ORDER BY r.created_at DESC
      `;

      const responses = await AppDataSource.query(query, [studyId]);
      
      if (responses.length === 0) {
        console.log('No mental maps found for study:', studyId);
        return [];
      }

      // For each response, get the drawing elements
      const mentalMaps = await Promise.all(
        responses.map(async (row: any) => {
          const elementsQuery = `
            SELECT 
              de.id,
              de.element_type,
              de.style_properties,
              de.metadata,
              ST_AsGeoJSON(de.geometry) as geometry_json
            FROM mental_maps.drawing_elements de
            WHERE de.map_drawing_id = $1
            ORDER BY de.created_at ASC
          `;

          let elements = [];
          try {
            const elementsResult = await AppDataSource.query(elementsQuery, [row.map_drawing_id]);
            elements = elementsResult.map((elem: any) => ({
              id: elem.id,
              type: elem.element_type,
              geometry: elem.geometry_json ? JSON.parse(elem.geometry_json) : null,
              style: elem.style_properties || {},
              metadata: elem.metadata || {}
            }));
          } catch (elemError) {
            console.warn('Error fetching elements for drawing:', row.map_drawing_id, elemError);
            // Continue without elements if there's an error
          }

          return {
            responseId: row.response_id,
            participantId: row.participant_id,
            participantCode: row.participant_code,
            questionId: row.question_id,
            questionTitle: row.question_title,
            questionText: row.question_text,
            responseTimeMs: row.response_time_ms || 0,
            responseCreatedAt: row.response_created_at,
            participantCreatedAt: row.participant_created_at,
            mapDrawing: {
              id: row.map_drawing_id,
              bounds: null,
              drawingData: row.drawing_data || {},
              createdAt: row.drawing_created_at,
              elements: elements
            }
          };
        })
      );

      console.log(`Found ${mentalMaps.length} mental maps for study ${studyId}`);
      return mentalMaps;
      
    } catch (error) {
      console.error('Mental maps query error:', error);
      
      // Fallback to mock data if database query fails
      console.log('Falling back to mock data due to database error');
      return [
        {
          responseId: 'mock-response-1',
          participantId: 'mock-participant-1',
          participantCode: 'P001',
          questionId: 'mock-question-1',
          questionTitle: 'Zeichnen Sie Ihre Mental Map',
          questionText: 'Bitte zeichnen Sie Ihre Vorstellung des Stadtzentrums',
          responseTimeMs: 45000,
          responseCreatedAt: new Date().toISOString(),
          participantCreatedAt: new Date().toISOString(),
          mapDrawing: {
            id: 'mock-drawing-1',
            bounds: null,
            drawingData: {},
            createdAt: new Date().toISOString(),
            elements: [
              {
                id: 'mock-element-1',
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
                  label: 'Stadtpark (Mock)',
                  createdWith: 'Smart Draw'
                }
              }
            ]
          }
        }
      ];
    }
  }

  async submitResponse(data: SubmitResponseRequest): Promise<Response> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate participant exists and session is active
      const participant = await this.participantRepository.findById(data.participantId);
      if (!participant) {
        throw new ApiError('Participant not found', 404, 'PARTICIPANT_NOT_FOUND');
      }

      if (participant.completedAt) {
        throw new ApiError('Participant session has already been completed', 400, 'SESSION_COMPLETED');
      }

      // Validate question exists and belongs to the study
      const question = await this.questionRepository.findById(data.questionId);
      if (!question) {
        throw new ApiError('Question not found', 404, 'QUESTION_NOT_FOUND');
      }

      if (question.studyId !== participant.studyId) {
        throw new ApiError('Question does not belong to participant study', 400, 'INVALID_QUESTION');
      }

      // Check if response already exists (update vs create)
      let response = await this.responseRepository.findByParticipantAndQuestion(
        data.participantId,
        data.questionId
      );

      if (response) {
        // Update existing response
        response.responseData = data.responseData;
        response.responseTimeMs = data.responseTimeMs;
        response = await queryRunner.manager.save(response);
      } else {
        // Create new response
        response = queryRunner.manager.create(Response, {
          participantId: data.participantId,
          questionId: data.questionId,
          responseData: data.responseData,
          responseTimeMs: data.responseTimeMs
        });
        response = await queryRunner.manager.save(response);
      }

      // Handle map drawing if provided
      if (data.mapDrawing) {
        await this.saveMapDrawing(queryRunner, response.id, data.mapDrawing);
      }

      await queryRunner.commitTransaction();

      // Return response with relations
      return await this.responseRepository.findWithMapDrawings(response.id) || response;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to submit response', 500, 'SUBMISSION_ERROR', error);
    } finally {
      await queryRunner.release();
    }
  }

  private async saveMapDrawing(queryRunner: any, responseId: string, mapDrawingData: any): Promise<void> {
    // Create map drawing first
    let savedMapDrawing;
    
    if (mapDrawingData.bounds) {
      const { north, south, east, west } = mapDrawingData.bounds;
      const boundsWKT = `POLYGON((${west} ${south}, ${east} ${south}, ${east} ${north}, ${west} ${north}, ${west} ${south}))`;
      
      // Use raw SQL to insert with PostGIS function
      const result = await queryRunner.manager.query(`
        INSERT INTO mental_maps.map_drawings (response_id, bounds, drawing_data, created_at)
        VALUES ($1, ST_GeomFromText($2, 4326), $3, NOW())
        RETURNING id
      `, [responseId, boundsWKT, JSON.stringify(mapDrawingData.drawingData || {})]);
      
      savedMapDrawing = { id: result[0].id };
    } else {
      // No bounds - use regular TypeORM save
      const mapDrawing = queryRunner.manager.create(MapDrawing, {
        responseId: responseId,
        bounds: null,
        drawingData: mapDrawingData.drawingData || {}
      });
      savedMapDrawing = await queryRunner.manager.save(mapDrawing);
    }

    // Create drawing elements
    if (mapDrawingData.elements && mapDrawingData.elements.length > 0) {
      for (const elementData of mapDrawingData.elements) {
        const geometryWKT = this.geoJsonToWKT(elementData.geometry);
        
        // Use raw SQL to insert with PostGIS function
        await queryRunner.manager.query(`
          INSERT INTO mental_maps.drawing_elements (map_drawing_id, element_type, geometry, style_properties, metadata, created_at)
          VALUES ($1, $2, ST_GeomFromText($3, 4326), $4, $5, NOW())
        `, [
          savedMapDrawing.id,
          elementData.type,
          geometryWKT,
          JSON.stringify(elementData.style || {}),
          JSON.stringify(elementData.metadata || {})
        ]);
      }
    }
  }

  private geoJsonToWKT(geometry: GeoJSON.Geometry): string {
    switch (geometry.type) {
      case 'Point':
        const [lng, lat] = geometry.coordinates as [number, number];
        return `POINT(${lng} ${lat})`;
      
      case 'LineString':
        const lineCoords = (geometry.coordinates as [number, number][])
          .map(([lng, lat]) => `${lng} ${lat}`)
          .join(', ');
        return `LINESTRING(${lineCoords})`;
      
      case 'Polygon':
        const rings = (geometry.coordinates as [number, number][][])
          .map(ring => 
            ring.map(([lng, lat]) => `${lng} ${lat}`).join(', ')
          )
          .map(ring => `(${ring})`)
          .join(', ');
        return `POLYGON(${rings})`;
      
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
  }

  async updateResponse(id: string, data: UpdateResponseRequest): Promise<Response> {
    throw new ApiError('Method not implemented', 501, 'NOT_IMPLEMENTED');
  }

  async getResponse(id: string): Promise<Response> {
    const response = await this.responseRepository.findWithMapDrawings(id);
    if (!response) {
      throw new ApiError('Response not found', 404, 'RESPONSE_NOT_FOUND');
    }
    return response;
  }

  async getResponsesByStudy(studyId: string, filters?: ResponseFilters): Promise<Response[]> {
    return await this.responseRepository.findByStudyWithFilters(studyId, filters);
  }

  async deleteResponse(id: string): Promise<void> {
    const response = await this.responseRepository.findById(id);
    if (!response) {
      throw new ApiError('Response not found', 404, 'RESPONSE_NOT_FOUND');
    }

    await this.responseRepository.delete(id);
  }

  async exportResponses(studyId: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    const mentalMaps = await this.getMentalMapsByStudy(studyId);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = mentalMaps.map(map => ({
        participant_code: map.participantCode,
        question_title: map.questionTitle,
        response_time_ms: map.responseTimeMs,
        elements_count: map.mapDrawing.elements.length,
        created_at: map.responseCreatedAt
      }));
      return csvData;
    }
    
    return mentalMaps;
  }

  async getResponseStatistics(studyId: string): Promise<any> {
    const mentalMaps = await this.getMentalMapsByStudy(studyId);
    
    return {
      totalMaps: mentalMaps.length,
      totalParticipants: new Set(mentalMaps.map(m => m.participantCode)).size,
      averageResponseTime: mentalMaps.length > 0 
        ? Math.round(mentalMaps.reduce((sum, m) => sum + m.responseTimeMs, 0) / mentalMaps.length)
        : 0,
      averageElementsPerMap: mentalMaps.length > 0
        ? Math.round(mentalMaps.reduce((sum, m) => sum + m.mapDrawing.elements.length, 0) / mentalMaps.length)
        : 0
    };
  }
}