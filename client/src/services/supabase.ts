import { createClient } from '@supabase/supabase-js';
import { Question, QuizQuestion } from '../types';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    })
  : null;

/**
 * Upload an image file or base64 to Supabase Storage bucket ('game-images')
 */
export async function uploadGameImage(file: File | Blob, path: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.storage.from('game-images').upload(path, file, {
      upsert: true,
      contentType: (file as File).type || 'image/jpeg',
    });

    if (error) {
      console.warn('Supabase storage upload error:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from('game-images').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Failed to upload image to Supabase:', err);
    return null;
  }
}

/**
 * Fetch questions from Supabase table or fallback
 */
export async function fetchSupabaseQuestions(): Promise<Question[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('questions').select('*').order('created_at', { ascending: true });
    if (error || !data || data.length === 0) return null;
    return data as Question[];
  } catch (err) {
    console.error('Error fetching questions from Supabase:', err);
    return null;
  }
}

/**
 * Fetch quiz questions from Supabase table or fallback
 */
export async function fetchSupabaseQuizQuestions(): Promise<QuizQuestion[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('quiz_questions').select('*').order('created_at', { ascending: true });
    if (error || !data || data.length === 0) return null;
    return data as QuizQuestion[];
  } catch (err) {
    console.error('Error fetching quiz questions from Supabase:', err);
    return null;
  }
}

/**
 * Save final game leaderboard to Supabase table
 */
export async function saveGameLeaderboard(roomCode: string, gameTitle: string, leaderboard: any[]): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('game_scores').insert({
      room_code: roomCode,
      game_title: gameTitle,
      leaderboard: leaderboard,
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch (err) {
    console.error('Error saving leaderboard to Supabase:', err);
    return false;
  }
}
