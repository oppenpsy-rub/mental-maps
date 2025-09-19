import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource, initializeDatabase, closeDatabase } from '../../database/connection';
import { ResearcherRepository } from '../../repositories/ResearcherRepository';
import { Researcher } from '../../models/Researcher';
import bcrypt from 'bcryptjs';

describe('ResearcherRepository', () => {
  let repository: ResearcherRepository;

  beforeAll(async () => {
    // Skip database tests if no database is available
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      console.log('⚠️  Skipping repository tests - no database configuration found');
      return;
    }

    await initializeDatabase();
    repository = new ResearcherRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Skip if no database
    if (!AppDataSource.isInitialized) return;

    // Clean up test data
    await AppDataSource.getRepository(Researcher).delete({});
  });

  describe('Basic CRUD Operations', () => {
    it('should create a new researcher', async () => {
      if (!AppDataSource.isInitialized) return;

      const researcherData = {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test Researcher',
        institution: 'Test University'
      };

      const researcher = await repository.create(researcherData);

      expect(researcher.id).toBeDefined();
      expect(researcher.email).toBe(researcherData.email);
      expect(researcher.name).toBe(researcherData.name);
      expect(researcher.institution).toBe(researcherData.institution);
      expect(researcher.createdAt).toBeDefined();
      expect(researcher.updatedAt).toBeDefined();
    });

    it('should find researcher by ID', async () => {
      if (!AppDataSource.isInitialized) return;

      const researcherData = {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test Researcher'
      };

      const created = await repository.create(researcherData);
      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(researcherData.email);
    });

    it('should find researcher by email', async () => {
      if (!AppDataSource.isInitialized) return;

      const researcherData = {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test Researcher'
      };

      await repository.create(researcherData);
      const found = await repository.findByEmail(researcherData.email);

      expect(found).toBeDefined();
      expect(found?.email).toBe(researcherData.email);
    });

    it('should update researcher', async () => {
      if (!AppDataSource.isInitialized) return;

      const researcherData = {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test Researcher'
      };

      const created = await repository.create(researcherData);
      const updated = await repository.update(created.id, {
        name: 'Updated Name',
        institution: 'Updated University'
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.institution).toBe('Updated University');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should delete researcher', async () => {
      if (!AppDataSource.isInitialized) return;

      const researcherData = {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test Researcher'
      };

      const created = await repository.create(researcherData);
      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('Email Operations', () => {
    it('should check if email exists', async () => {
      if (!AppDataSource.isInitialized) return;

      const email = 'test@example.com';
      
      let exists = await repository.emailExists(email);
      expect(exists).toBe(false);

      await repository.create({
        email,
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test Researcher'
      });

      exists = await repository.emailExists(email);
      expect(exists).toBe(true);
    });

    it('should enforce unique email constraint', async () => {
      if (!AppDataSource.isInitialized) return;

      const researcherData = {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test Researcher'
      };

      await repository.create(researcherData);

      await expect(repository.create({
        ...researcherData,
        name: 'Another Researcher'
      })).rejects.toThrow();
    });
  });

  describe('Search Operations', () => {
    it('should search researchers by name', async () => {
      if (!AppDataSource.isInitialized) return;

      await repository.create({
        email: 'john@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'John Doe'
      });

      await repository.create({
        email: 'jane@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Jane Smith'
      });

      const results = await repository.searchByName('John');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Doe');
    });

    it('should find researchers by institution', async () => {
      if (!AppDataSource.isInitialized) return;

      const institution = 'Test University';

      await repository.create({
        email: 'researcher1@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Researcher 1',
        institution
      });

      await repository.create({
        email: 'researcher2@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Researcher 2',
        institution
      });

      const results = await repository.findByInstitution(institution);
      expect(results).toHaveLength(2);
    });
  });
});