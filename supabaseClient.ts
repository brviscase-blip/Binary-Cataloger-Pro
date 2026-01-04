
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://scychivkzwcojekmsngd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjeWNoaXZrendjb2pla21zbmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjA0MDcsImV4cCI6MjA4MjYzNjQwN30.g3OR9P42ZMslnyKKyFlz3xQGD5FnnvOIFP0GraIU3R0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
