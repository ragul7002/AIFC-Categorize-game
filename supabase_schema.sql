-- =========================================================================
-- SUPABASE SQL SCHEMA FOR AIFC CATEGORIZE & QUIZ GAME
-- Run this in your Supabase Project -> SQL Editor -> Run
-- =========================================================================

-- 1. Game Rooms Table
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'AI Frontier Club Categorization Game',
  status VARCHAR(30) NOT NULL DEFAULT 'WAITING',
  host_token TEXT,
  default_time_limit INT DEFAULT 35,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  time_limit_seconds INT DEFAULT 35,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id TEXT PRIMARY KEY,
  question_text TEXT NOT NULL,
  image_url TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option TEXT NOT NULL,
  time_limit_seconds INT DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Game Scores / Leaderboard History Table
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL,
  game_title TEXT,
  leaderboard JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) and allow public read/write for game sessions
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on game_rooms" ON public.game_rooms FOR SELECT USING (true);
CREATE POLICY "Allow public insert on game_rooms" ON public.game_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on game_rooms" ON public.game_rooms FOR UPDATE USING (true);

CREATE POLICY "Allow public read on questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on questions" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on questions" ON public.questions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on questions" ON public.questions FOR DELETE USING (true);

CREATE POLICY "Allow public read on quiz_questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on quiz_questions" ON public.quiz_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on quiz_questions" ON public.quiz_questions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on quiz_questions" ON public.quiz_questions FOR DELETE USING (true);

CREATE POLICY "Allow public read on game_scores" ON public.game_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert on game_scores" ON public.game_scores FOR INSERT WITH CHECK (true);

-- Enable Realtime for game_rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
