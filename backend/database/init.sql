-- Mental Maps Database Initialization
-- This script sets up the basic database structure and extensions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create database schema
CREATE SCHEMA IF NOT EXISTS mental_maps;

-- Set search path
SET search_path TO mental_maps, public;

-- Create user for the application (if needed)
-- Note: This should be done by the database administrator
-- CREATE USER mental_maps_user WITH PASSWORD 'your_secure_password';
-- GRANT USAGE ON SCHEMA mental_maps TO mental_maps_user;
-- GRANT CREATE ON SCHEMA mental_maps TO mental_maps_user;