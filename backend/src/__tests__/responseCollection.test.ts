import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { AppDataSource } from '../database/connection';
import { Response } from '../models/Response';
import { Participant } from '../models/Participant';
import { Study } from '../models/Study';
import { Question } from '../models/Question';
import { Researcher } from '../models/Researcher';
import { MapDrawing } from '../models/MapDrawing';
import { DrawingElement } from '../models/DrawingElement';
import { ResponseCollectionService } from '../services/ResponseCollectionService';

describe('Response Collection API', () => {
  let researcher: Researcher;
  let study: Study;
  let question: Question;
  let participant: Participant;
  let authToken: string;
  let participantToken: string;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clean database
    await AppDataSource.getRepository(DrawingElement).delete({});
    await AppDataSource.getRepository(MapDrawing).delete({});
    await AppDataSource.getRepository(Response).delete({});
    await AppDataSource.getRepository(Participant).delete({});
    await AppDataSource.getRepository(Question).delete({});
    await AppDataSource.getRepository(Study).delete({});
    await AppDataSource.getRepository(Researcher).delete({});

    // Create test researcher
    researcher = AppDataSource.getRepository(Researcher).create({
      email: 'test@example.com',
      name: 'Test Researcher',
      institution: 'Test University'
    });
    researcher = await AppDataSource.getRepository(Researcher).save(researcher);

    // Create auth token for researcher
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    authToken = authResponse.body.data.token;

    // Create test study
    study = AppDataSource.getRepository(Study).create({
      researcherId: researcher.id,
      title: 'Test Study',
      description: 'Test Description',
      settings: {},
      active: true
    });
    study = await AppDataSource.getRepository(Study).save(study);

    // Create test question
    question = AppDataSource.getRepository(Question).create({
      studyId: study.id,
      questionText: 'Test Question',
      questionType: 'map_drawing',
      configuration: {},
      orderIndex: 1
    });
    question = await AppDataSource.getRepository(Question).save(question);

    // Create test participant
    participant = AppDataSource.getRepository(Participant).create({
      studyId: study.id,
      sessionToken: 'test-session-token',
      demographicData: {}
    });
    participant = await AppDataSource.getRepository(Participant).save(participant);
    participantToken = participant.sessionToken;
  });

  describe('POST /api/responses', () => {
    it('should submit a new response successfully', async () => {
      const responseData = {
        participantId: participant.id,
        questionId: question.id,
        responseData: {
          textResponse: 'Test response',
          ratingValue: 5
        },
        responseTimeMs: 30000
      };

      const response = await request(app)
        .post('/api/responses')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.responseData.textResponse).toBe('Test response');
      expect(response.body.data.responseTimeMs).toBe(30000);
    });

    it('should submit response with map drawing', async () => {
      const responseData = {
        participantId: participant.id,
        questionId: question.id,
        responseData: {
          textResponse: 'Test with map'
        },
        mapDrawing: {
          bounds: {
            north: 52.5,
            south: 52.4,
            east: 13.5,
            west: 13.4
          },
          drawingData: {
            version: '1.0',
            canvasData: { objects: [] },
            metadata: {
              zoomLevel: 10,
              mapStyle: 'osm'
            }
          },
          elements: [
            {
              type: 'point' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: [13.45, 52.45]
              } as GeoJSON.Point,
              style: {
                color: '#ff0000',
                radius: 5
              },
              metadata: {
                label: 'Test Point'
              }
            }
          ]
        }
      };

      const response = await request(app)
        .post('/api/responses')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mapDrawings).toBeDefined();
      expect(response.body.data.mapDrawings.length).toBe(1);
    });

    it('should anonymize PII in response data', async () => {
      const responseData = {
        participantId: participant.id,
        questionId: question.id,
        responseData: {
          textResponse: 'My email is john.doe@example.com and my phone is 555-123-4567',
          demographicResponses: {
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            age: 25
          }
        }
      };

      const response = await request(app)
        .post('/api/responses')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(responseData)
        .expect(201);

      expect(response.body.data.responseData.textResponse).toContain('[EMAIL]');
      expect(response.body.data.responseData.textResponse).toContain('[PHONE]');
      expect(response.body.data.responseData.demographicResponses.fullName).toBeUndefined();
      expect(response.body.data.responseData.demographicResponses.email).toBeUndefined();
      expect(response.body.data.responseData.demographicResponses.ageRange).toBe('25-34');
    });

    it('should reject invalid participant ID', async () => {
      const responseData = {
        participantId: 'invalid-id',
        questionId: question.id,
        responseData: {
          textResponse: 'Test'
        }
      };

      await request(app)
        .post('/api/responses')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(responseData)
        .expect(400);
    });

    it('should reject response for non-existent participant', async () => {
      const responseData = {
        participantId: '550e8400-e29b-41d4-a716-446655440000',
        questionId: question.id,
        responseData: {
          textResponse: 'Test'
        }
      };

      await request(app)
        .post('/api/responses')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(responseData)
        .expect(404);
    });

    it('should reject response for completed participant session', async () => {
      // Complete the participant session
      participant.completedAt = new Date();
      await AppDataSource.getRepository(Participant).save(participant);

      const responseData = {
        participantId: participant.id,
        questionId: question.id,
        responseData: {
          textResponse: 'Test'
        }
      };

      await request(app)
        .post('/api/responses')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(responseData)
        .expect(400);
    });
  });

  describe('GET /api/responses/study/:studyId', () => {
    let response1: Response;
    let response2: Response;

    beforeEach(async () => {
      // Create test responses
      response1 = AppDataSource.getRepository(Response).create({
        participantId: participant.id,
        questionId: question.id,
        responseData: { textResponse: 'Response 1' },
        responseTimeMs: 10000
      });
      response1 = await AppDataSource.getRepository(Response).save(response1);

      response2 = AppDataSource.getRepository(Response).create({
        participantId: participant.id,
        questionId: question.id,
        responseData: { textResponse: 'Response 2' },
        responseTimeMs: 15000
      });
      response2 = await AppDataSource.getRepository(Response).save(response2);
    });

    it('should get all responses for a study', async () => {
      const response = await request(app)
        .get(`/api/responses/study/${study.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.count).toBe(2);
    });

    it('should filter responses by participant', async () => {
      const response = await request(app)
        .get(`/api/responses/study/${study.id}`)
        .query({ participantId: participant.id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
    });

    it('should filter responses by question', async () => {
      const response = await request(app)
        .get(`/api/responses/study/${study.id}`)
        .query({ questionId: question.id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/responses/study/${study.id}`)
        .expect(401);
    });
  });

  describe('GET /api/responses/:id', () => {
    let testResponse: Response;

    beforeEach(async () => {
      testResponse = AppDataSource.getRepository(Response).create({
        participantId: participant.id,
        questionId: question.id,
        responseData: { textResponse: 'Test Response' },
        responseTimeMs: 12000
      });
      testResponse = await AppDataSource.getRepository(Response).save(testResponse);
    });

    it('should get specific response', async () => {
      const response = await request(app)
        .get(`/api/responses/${testResponse.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testResponse.id);
      expect(response.body.data.responseData.textResponse).toBe('Test Response');
    });

    it('should return 404 for non-existent response', async () => {
      await request(app)
        .get('/api/responses/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/responses/:id', () => {
    let testResponse: Response;

    beforeEach(async () => {
      testResponse = AppDataSource.getRepository(Response).create({
        participantId: participant.id,
        questionId: question.id,
        responseData: { textResponse: 'Original Response' },
        responseTimeMs: 10000
      });
      testResponse = await AppDataSource.getRepository(Response).save(testResponse);
    });

    it('should update response data', async () => {
      const updateData = {
        responseData: {
          textResponse: 'Updated Response',
          ratingValue: 8
        },
        responseTimeMs: 15000
      };

      const response = await request(app)
        .put(`/api/responses/${testResponse.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.responseData.textResponse).toBe('Updated Response');
      expect(response.body.data.responseData.ratingValue).toBe(8);
      expect(response.body.data.responseTimeMs).toBe(15000);
    });

    it('should update map drawing', async () => {
      const updateData = {
        mapDrawing: {
          bounds: {
            north: 53.0,
            south: 52.0,
            east: 14.0,
            west: 13.0
          },
          drawingData: {
            version: '2.0',
            canvasData: { objects: [{ type: 'rect' }] }
          },
          elements: [
            {
              type: 'polygon' as const,
              geometry: {
                type: 'Polygon' as const,
                coordinates: [[[13.1, 52.1], [13.9, 52.1], [13.9, 52.9], [13.1, 52.9], [13.1, 52.1]]]
              } as GeoJSON.Polygon,
              style: {
                fillColor: '#00ff00',
                fillOpacity: 0.5
              },
              metadata: {}
            }
          ]
        }
      };

      const response = await request(app)
        .put(`/api/responses/${testResponse.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mapDrawings).toBeDefined();
    });

    it('should reject update for completed session', async () => {
      // Complete the participant session
      participant.completedAt = new Date();
      await AppDataSource.getRepository(Participant).save(participant);

      const updateData = {
        responseData: {
          textResponse: 'Updated Response'
        }
      };

      await request(app)
        .put(`/api/responses/${testResponse.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('DELETE /api/responses/:id', () => {
    let testResponse: Response;

    beforeEach(async () => {
      testResponse = AppDataSource.getRepository(Response).create({
        participantId: participant.id,
        questionId: question.id,
        responseData: { textResponse: 'To be deleted' }
      });
      testResponse = await AppDataSource.getRepository(Response).save(testResponse);
    });

    it('should delete response', async () => {
      await request(app)
        .delete(`/api/responses/${testResponse.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify response is deleted
      const deletedResponse = await AppDataSource.getRepository(Response).findOne({
        where: { id: testResponse.id }
      });
      expect(deletedResponse).toBeNull();
    });

    it('should return 404 for non-existent response', async () => {
      await request(app)
        .delete('/api/responses/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/responses/study/:studyId/export', () => {
    beforeEach(async () => {
      // Create test responses for export
      const response1 = AppDataSource.getRepository(Response).create({
        participantId: participant.id,
        questionId: question.id,
        responseData: { textResponse: 'Export Response 1' },
        responseTimeMs: 10000
      });
      await AppDataSource.getRepository(Response).save(response1);

      const response2 = AppDataSource.getRepository(Response).create({
        participantId: participant.id,
        questionId: question.id,
        responseData: { textResponse: 'Export Response 2' },
        responseTimeMs: 15000
      });
      await AppDataSource.getRepository(Response).save(response2);
    });

    it('should export responses in JSON format', async () => {
      const response = await request(app)
        .post(`/api/responses/study/${study.id}/export`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'json' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.filename).toContain('.json');
    });

    it('should export responses in CSV format', async () => {
      const response = await request(app)
        .post(`/api/responses/study/${study.id}/export`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'csv' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.filename).toContain('.csv');
    });
  });

  describe('GET /api/responses/study/:studyId/statistics', () => {
    beforeEach(async () => {
      // Create test responses for statistics
      const response1 = AppDataSource.getRepository(Response).create({
        participantId: participant.id,
        questionId: question.id,
        responseData: { textResponse: 'Stats Response 1' },
        responseTimeMs: 10000
      });
      await AppDataSource.getRepository(Response).save(response1);

      const response2 = AppDataSource.getRepository(Response).create({
        participantId: participant.id,
        questionId: question.id,
        responseData: { textResponse: 'Stats Response 2' },
        responseTimeMs: 20000
      });
      await AppDataSource.getRepository(Response).save(response2);
    });

    it('should get response statistics', async () => {
      const response = await request(app)
        .get(`/api/responses/study/${study.id}/statistics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalResponses).toBe(2);
      expect(response.body.data.uniqueParticipants).toBe(1);
      expect(response.body.data.avgResponseTime).toBe(15000);
    });
  });
});

describe('ResponseCollectionService', () => {
  let service: ResponseCollectionService;
  let researcher: Researcher;
  let study: Study;
  let question: Question;
  let participant: Participant;

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = new ResponseCollectionService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clean database
    await AppDataSource.getRepository(DrawingElement).delete({});
    await AppDataSource.getRepository(MapDrawing).delete({});
    await AppDataSource.getRepository(Response).delete({});
    await AppDataSource.getRepository(Participant).delete({});
    await AppDataSource.getRepository(Question).delete({});
    await AppDataSource.getRepository(Study).delete({});
    await AppDataSource.getRepository(Researcher).delete({});

    // Create test data
    researcher = AppDataSource.getRepository(Researcher).create({
      email: 'service-test@example.com',
      name: 'Service Test Researcher',
      institution: 'Test University'
    });
    researcher = await AppDataSource.getRepository(Researcher).save(researcher);

    study = AppDataSource.getRepository(Study).create({
      researcherId: researcher.id,
      title: 'Service Test Study',
      description: 'Test Description',
      settings: {},
      active: true
    });
    study = await AppDataSource.getRepository(Study).save(study);

    question = AppDataSource.getRepository(Question).create({
      studyId: study.id,
      questionText: 'Service Test Question',
      questionType: 'map_drawing',
      configuration: {},
      orderIndex: 1
    });
    question = await AppDataSource.getRepository(Question).save(question);

    participant = AppDataSource.getRepository(Participant).create({
      studyId: study.id,
      sessionToken: 'service-test-token',
      demographicData: {}
    });
    participant = await AppDataSource.getRepository(Participant).save(participant);
  });

  describe('submitResponse', () => {
    it('should create new response with map drawing', async () => {
      const requestData = {
        participantId: participant.id,
        questionId: question.id,
        responseData: {
          textResponse: 'Service test response'
        },
        mapDrawing: {
          bounds: {
            north: 52.5,
            south: 52.4,
            east: 13.5,
            west: 13.4
          },
          drawingData: {
            version: '1.0',
            canvasData: { objects: [] }
          },
          elements: [
            {
              type: 'point' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: [13.45, 52.45]
              } as GeoJSON.Point,
              style: {
                color: '#ff0000'
              },
              metadata: {}
            }
          ]
        },
        responseTimeMs: 25000
      };

      const response = await service.submitResponse(requestData);

      expect(response.id).toBeDefined();
      expect(response.responseData.textResponse).toBe('Service test response');
      expect(response.responseTimeMs).toBe(25000);
      expect(response.mapDrawings).toBeDefined();
      expect(response.mapDrawings.length).toBe(1);
    });

    it('should update existing response', async () => {
      // Create initial response
      const initialData = {
        participantId: participant.id,
        questionId: question.id,
        responseData: {
          textResponse: 'Initial response'
        }
      };

      const initialResponse = await service.submitResponse(initialData);

      // Update the response
      const updateData = {
        participantId: participant.id,
        questionId: question.id,
        responseData: {
          textResponse: 'Updated response',
          ratingValue: 7
        },
        responseTimeMs: 30000
      };

      const updatedResponse = await service.submitResponse(updateData);

      expect(updatedResponse.id).toBe(initialResponse.id);
      expect(updatedResponse.responseData.textResponse).toBe('Updated response');
      expect(updatedResponse.responseData.ratingValue).toBe(7);
      expect(updatedResponse.responseTimeMs).toBe(30000);
    });

    it('should throw error for non-existent participant', async () => {
      const requestData = {
        participantId: '550e8400-e29b-41d4-a716-446655440000',
        questionId: question.id,
        responseData: {
          textResponse: 'Test'
        }
      };

      await expect(service.submitResponse(requestData)).rejects.toThrow('Participant not found');
    });

    it('should throw error for completed session', async () => {
      // Complete the session
      participant.completedAt = new Date();
      await AppDataSource.getRepository(Participant).save(participant);

      const requestData = {
        participantId: participant.id,
        questionId: question.id,
        responseData: {
          textResponse: 'Test'
        }
      };

      await expect(service.submitResponse(requestData)).rejects.toThrow('Participant session has already been completed');
    });
  });

  describe('anonymization', () => {
    it('should anonymize email addresses', async () => {
      const requestData = {
        participantId: participant.id,
        questionId: question.id,
        responseData: {
          textResponse: 'Contact me at john.doe@example.com for more info'
        }
      };

      const response = await service.submitResponse(requestData);
      expect(response.responseData.textResponse).toContain('[EMAIL]');
      expect(response.responseData.textResponse).not.toContain('john.doe@example.com');
    });

    it('should anonymize phone numbers', async () => {
      const requestData = {
        participantId: participant.id,
        questionId: question.id,
        responseData: {
          textResponse: 'Call me at 555-123-4567 or 5551234567'
        }
      };

      const response = await service.submitResponse(requestData);
      expect(response.responseData.textResponse).toContain('[PHONE]');
      expect(response.responseData.textResponse).not.toContain('555-123-4567');
    });

    it('should anonymize demographic data', async () => {
      const requestData = {
        participantId: participant.id,
        questionId: question.id,
        responseData: {
          demographicResponses: {
            fullName: 'John Doe',
            email: 'john@example.com',
            age: 28,
            occupation: 'Engineer'
          }
        }
      };

      const response = await service.submitResponse(requestData);
      const demo = response.responseData.demographicResponses;
      
      // Ensure demo exists and check its properties
      expect(demo).toBeDefined();
      if (demo) {
        expect(demo.fullName).toBeUndefined();
        expect(demo.email).toBeUndefined();
        expect(demo.age).toBeUndefined();
        expect(demo.ageRange).toBe('25-34');
        expect(demo.occupation).toBe('Engineer'); // Should keep non-PII data
      }
    });
  });
});