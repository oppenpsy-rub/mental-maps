-- Mental Maps Database Schema
-- Migration 001: Initial schema creation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create schema
CREATE SCHEMA IF NOT EXISTS mental_maps;
SET search_path TO mental_maps, public;

-- Researchers table
CREATE TABLE researchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Studies table
CREATE TABLE studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    researcher_id UUID NOT NULL REFERENCES researchers(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('map_drawing', 'audio_response', 'demographic', 'rating', 'heatmap')),
    configuration JSONB DEFAULT '{}',
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(study_id, order_index)
);

-- Audio stimuli table
CREATE TABLE audio_stimuli (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    duration_seconds DECIMAL(10,3),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table (anonymous sessions)
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    demographic_data JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT
);

-- Responses table
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    response_data JSONB DEFAULT '{}',
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, question_id)
);

-- Map drawings table
CREATE TABLE map_drawings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    bounds GEOMETRY(POLYGON, 4326),
    drawing_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drawing elements table
CREATE TABLE drawing_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    map_drawing_id UUID NOT NULL REFERENCES map_drawings(id) ON DELETE CASCADE,
    element_type VARCHAR(50) NOT NULL CHECK (element_type IN ('point', 'line', 'polygon', 'circle', 'text', 'heatmap_point')),
    geometry GEOMETRY(GEOMETRY, 4326),
    style_properties JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_researchers_email ON researchers(email);
CREATE INDEX idx_studies_researcher_id ON studies(researcher_id);
CREATE INDEX idx_studies_active ON studies(active);
CREATE INDEX idx_questions_study_id ON questions(study_id);
CREATE INDEX idx_questions_order ON questions(study_id, order_index);
CREATE INDEX idx_audio_stimuli_question_id ON audio_stimuli(question_id);
CREATE INDEX idx_participants_study_id ON participants(study_id);
CREATE INDEX idx_participants_session_token ON participants(session_token);
CREATE INDEX idx_responses_participant_id ON responses(participant_id);
CREATE INDEX idx_responses_question_id ON responses(question_id);
CREATE INDEX idx_map_drawings_response_id ON map_drawings(response_id);
CREATE INDEX idx_drawing_elements_map_drawing_id ON drawing_elements(map_drawing_id);

-- Spatial indexes
CREATE INDEX idx_map_drawings_bounds ON map_drawings USING GIST(bounds);
CREATE INDEX idx_drawing_elements_geometry ON drawing_elements USING GIST(geometry);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_researchers_updated_at BEFORE UPDATE ON researchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_studies_updated_at BEFORE UPDATE ON studies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW study_statistics AS
SELECT 
    s.id,
    s.title,
    s.researcher_id,
    s.active,
    COUNT(DISTINCT p.id) as participant_count,
    COUNT(DISTINCT r.id) as response_count,
    COUNT(DISTINCT q.id) as question_count,
    s.created_at,
    s.updated_at
FROM studies s
LEFT JOIN participants p ON s.id = p.study_id
LEFT JOIN responses r ON p.id = r.participant_id
LEFT JOIN questions q ON s.id = q.study_id
GROUP BY s.id, s.title, s.researcher_id, s.active, s.created_at, s.updated_at;

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
    p.completed_at
FROM participants p
LEFT JOIN responses r ON p.id = r.participant_id
LEFT JOIN questions q ON p.study_id = q.study_id
GROUP BY p.id, p.study_id, p.session_token, p.started_at, p.completed_at;