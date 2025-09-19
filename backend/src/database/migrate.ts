#!/usr/bin/env node
import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from './connection';

// Load environment variables
dotenv.config();

async function runMigrations() {
  try {
    console.log('🚀 Starting database migration...');
    
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    
    const hasPendingMigrations = await AppDataSource.showMigrations();
    console.log(`📋 Checking for pending migrations...`);
    
    if (hasPendingMigrations) {
      await AppDataSource.runMigrations();
      console.log('✅ All migrations completed successfully');
    } else {
      console.log('ℹ️  No pending migrations');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}