-- Migration: Add session fields to participants table
-- Date: 2024-01-01
-- Description: Add expires_at, consent_given, created_at, and updated_at fields to participants table

-- Add new columns to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have default values
UPDATE participants 
SET 
  expires_at = COALESCE(expires_at, started_at + INTERVAL '24 hours'),
  consent_given = COALESCE(consent_given, true),
  created_at = COALESCE(created_at, started_at),
  updated_at = COALESCE(updated_at, started_at)
WHERE expires_at IS NULL OR consent_given IS NULL OR created_at IS NULL OR updated_at IS NULL;

-- Make expires_at NOT NULL after setting default values
ALTER TABLE participants 
ALTER COLUMN expires_at SET NOT NULL,
ALTER COLUMN consent_given SET NOT NULL,
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- Create index on expires_at for efficient session cleanup
CREATE INDEX IF NOT EXISTS idx_participants_expires_at ON participants(expires_at);

-- Create index on session_token for efficient lookups
CREATE INDEX IF NOT EXISTS idx_participants_session_token ON participants(session_token);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_participants_updated_at ON participants;
CREATE TRIGGER trigger_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_participants_updated_at();