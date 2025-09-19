-- Mental Maps Database Schema
-- Migration 002: Add session management columns to participants table

-- Add session management columns to participants table
ALTER TABLE participants 
ADD COLUMN session_data JSONB,
ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN metadata JSONB;

-- Create indexes for the new columns
CREATE INDEX idx_participants_last_active_at ON participants(last_active_at);
CREATE INDEX idx_participants_session_data ON participants USING GIN(session_data);

-- Create drawing_sessions table for storing temporary drawing states
CREATE TABLE drawing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    question_id UUID NOT NULL,
    drawing_state JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, question_id)
);

-- Create indexes for drawing_sessions
CREATE INDEX idx_drawing_sessions_participant_id ON drawing_sessions(participant_id);
CREATE INDEX idx_drawing_sessions_question_id ON drawing_sessions(question_id);

-- Add trigger for drawing_sessions updated_at
CREATE TRIGGER update_drawing_sessions_updated_at 
BEFORE UPDATE ON drawing_sessions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add isTemporary column to responses table for session management
ALTER TABLE responses 
ADD COLUMN is_temporary BOOLEAN DEFAULT FALSE;

-- Create index for temporary responses
CREATE INDEX idx_responses_is_temporary ON responses(is_temporary);

-- Update participant_progress view to include session data
DROP VIEW IF EXISTS participant_progress;

CREATE VIEW participant_progress AS
SELECT 
    p.id as participant_id,
    p.study_id,
    p.session_token,
    COUNT(DISTINCT r.id) as completed_responses,
    COUNT(DISTINCT q.id) as total_questions,
    CASE 
        WHEN COUNT(DISTINCT q.id) = 0 THEN 0
        ELSE ROUND((COUNT(DISTINCT r.id)::DECIMAL / COUNT(DISTINCT q.id)) * 100, 2)
    END as completion_percentage,
    p.started_at,
    p.completed_at,
    p.last_active_at,
    CASE 
        WHEN p.session_data IS NOT NULL THEN TRUE
        ELSE FALSE
    END as has_session_data,
    CASE 
        WHEN p.completed_at IS NULL AND p.last_active_at IS NOT NULL 
             AND p.last_active_at > NOW() - INTERVAL '24 hours' THEN TRUE
        ELSE FALSE
    END as is_recoverable
FROM participants p
LEFT JOIN responses r ON p.id = r.participant_id AND r.is_temporary = FALSE
LEFT JOIN questions q ON p.study_id = q.study_id
GROUP BY p.id, p.study_id, p.session_token, p.started_at, p.completed_at, p.last_active_at, p.session_data;