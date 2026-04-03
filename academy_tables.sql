
--- 1. TABELLA CORSI ACADEMY
CREATE TABLE IF NOT EXISTS academy_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'draft', -- draft, published, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 2. TABELLA LEZIONI
CREATE TABLE IF NOT EXISTS academy_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT,
    content_markdown TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 3. TABELLA ISCRIZIONI (Enrollments)
CREATE TABLE IF NOT EXISTS academy_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id), -- Lo studente (o agente)
    course_id UUID REFERENCES academy_courses(id),
    payment_status TEXT DEFAULT 'pending', -- pending, paid, free
    progress_percentage INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 4. RLS
ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Gli utenti possono gestire i propri corsi" ON academy_courses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Gli utenti possono vedere le lezioni dei corsi a cui hanno accesso" ON academy_lessons FOR SELECT USING (
    EXISTS (SELECT 1 FROM academy_courses WHERE id = course_id AND (user_id = auth.uid() OR status = 'published'))
);
CREATE POLICY "Gli utenti possono vedere le proprie iscrizioni" ON academy_enrollments FOR ALL USING (auth.uid() = user_id);
