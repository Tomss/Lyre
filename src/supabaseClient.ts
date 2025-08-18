import { createClient } from '@supabase/supabase-js'

// Storage fallback utility
const getAvailableStorage = () => {
  try {
    // Test localStorage availability
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return localStorage
  } catch {
    try {
      // Fallback to sessionStorage
      const testKey = '__storage_test__'
      sessionStorage.setItem(testKey, 'test')
      sessionStorage.removeItem(testKey)
      return sessionStorage
    } catch {
      // Return null if no storage is available
      return null
    }
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getAvailableStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})