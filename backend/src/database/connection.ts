import { DataSource } from 'typeorm';
import { Researcher } from '../models/Researcher';
import { Study } from '../models/Study';
import { Question } from '../models/Question';
import { AudioStimulus } from '../models/AudioStimulus';
import { Participant } from '../models/Participant';
import { Response } from '../models/Response';
import { MapDrawing } from '../models/MapDrawing';
import { DrawingElement } from '../models/DrawingElement';
import { DrawingSession } from '../models/DrawingSession';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'mental_maps_dev',
  schema: process.env.DB_SCHEMA || 'mental_maps',
  synchronize: false, // Disable auto-sync to avoid conflicts
  logging: process.env.NODE_ENV === 'development',
  entities: [
    Researcher,
    Study,
    Question,
    AudioStimulus,
    Participant,
    Response,
    MapDrawing,
    DrawingElement,
    DrawingSession,
  ],
  migrations: ['src/database/migrations/*.sql'],
  migrationsTableName: 'migrations',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
    
    // Database schema synchronization enabled
    console.log('✅ Database connected (schema sync enabled)');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}