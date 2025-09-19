import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppDataSource, initializeDatabase, closeDatabase } from '../database/connection';

describe('Database Connection', () => {
  beforeAll(async () => {
    // Skip database tests if no database is available
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      console.log('⚠️  Skipping database tests - no database configuration found');
      return;
    }
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should connect to the database', async () => {
    // Skip if no database configuration
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      return;
    }

    await expect(initializeDatabase()).resolves.not.toThrow();
    expect(AppDataSource.isInitialized).toBe(true);
  });

  it('should have PostGIS extension available', async () => {
    // Skip if no database configuration
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      return;
    }

    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }

    const result = await AppDataSource.query(
      "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'postgis') as has_postgis"
    );
    
    expect(result[0].has_postgis).toBe(true);
  });

  it('should have uuid-ossp extension available', async () => {
    // Skip if no database configuration
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      return;
    }

    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }

    const result = await AppDataSource.query(
      "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') as has_uuid"
    );
    
    expect(result[0].has_uuid).toBe(true);
  });

  it('should have mental_maps schema', async () => {
    // Skip if no database configuration
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      return;
    }

    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }

    const result = await AppDataSource.query(
      "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'mental_maps') as has_schema"
    );
    
    expect(result[0].has_schema).toBe(true);
  });
});