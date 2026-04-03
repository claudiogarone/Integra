-- SCHEMA ACCADEMY COMPLETO (Integrazione Totale)
-- Esegui questo script nel SQL Editor di Supabase

-- 1. TABELLA CORSI PREMIUM
CREATE TABLE IF NOT EXISTS academy_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Generale',
    thumbnail_url TEXT DEFAULT 'https://via.placeholder.com/800x400?text=Corso',
    attachment_url TEXT, -- Dispensa/PDF principale
    is_mandatory BOOLEAN DEFAULT false,
    deadline DATE,
    certificate_template JSONB DEFAULT '{"title": "Attestato di Partecipazione", "signer": "La Direzione", "logo_show": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABELLA LEZIONI VIDEO
CREATE TABLE IF NOT EXISTS academy_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_type TEXT DEFAULT 'youtube', -- youtube, vimeo, upload
    video_url TEXT,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABELLA QUIZ E DOMANDE
CREATE TABLE IF NOT EXISTS academy_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Test Finale',
    passing_score INTEGER DEFAULT 70,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS academy_quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES academy_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB, -- Array di testi ["Opzione A", "Opzione B"]
    correct_option_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABELLA LIVE EVENTS (Webinar & Aula)
CREATE TABLE IF NOT EXISTS academy_live_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    platform_link TEXT, -- Link Meet/Zoom/Jitsi
    certificate_template JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TRACCIAMENTO PROGRESSI E PRESENZE
CREATE TABLE IF NOT EXISTS academy_course_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
    agent_email TEXT NOT NULL, -- Identificativo dello studente/agente
    progress INTEGER DEFAULT 0, -- 0-100%
    quiz_score INTEGER, -- Ultimo punteggio quiz
    time_spent_seconds INTEGER DEFAULT 0,
    access_token UUID DEFAULT uuid_generate_v4(), -- Per il link magico
    status TEXT DEFAULT 'assigned', -- assigned, in_progress, completed
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(course_id, agent_email)
);

CREATE TABLE IF NOT EXISTS academy_live_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    live_event_id UUID REFERENCES academy_live_events(id) ON DELETE CASCADE,
    agent_email TEXT NOT NULL,
    present BOOLEAN DEFAULT false,
    notes TEXT,
    UNIQUE(live_event_id, agent_email)
);

-- 6. MATERIALI E LAVAGNA
CREATE TABLE IF NOT EXISTS academy_course_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
    live_event_id UUID REFERENCES academy_live_events(id) ON DELETE CASCADE,
    type TEXT, -- 'whiteboard', 'shared_note', 'pdf'
    content TEXT, -- Markdown o DataURL lavagna
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security)
ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_live_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own academy" ON academy_courses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their lessons" ON academy_lessons FOR ALL USING (EXISTS (SELECT 1 FROM academy_courses WHERE id = course_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their lives" ON academy_live_events FOR ALL USING (auth.uid() = user_id);
