// @ts-check
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// URL polyfill needed on native only — breaks fetch on web
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: Platform.OS === 'web', // use localStorage on web
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
