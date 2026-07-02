import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabase';
import { registerPush } from '../services/pushService';

const AuthContext = createContext(null);

const GUEST_KEY         = 'fixera_guest';
const GUEST_CONTACT_KEY = 'fixera_guest_contact';

function readGuestContact() {
  try { return JSON.parse(sessionStorage.getItem(GUEST_CONTACT_KEY)) || null; }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_KEY) === 'true');
  const [guestContact, setGuestContact] = useState(readGuestContact);

  // Load profile from the "profiles" table
  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  }

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u.id);
        // Real account takes over — guest mode ends
        localStorage.removeItem(GUEST_KEY);
        setIsGuest(false);
        // Register for push notifications — no-op if Firebase not configured or permission denied
        registerPush(u.id, 'customer');
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Guest Mode (Bolt model: browse without account, contacts captured) ──
  async function continueAsGuest(contact) {
    // contact = { name, phone, email? }
    localStorage.setItem(GUEST_KEY, 'true');
    sessionStorage.setItem(GUEST_CONTACT_KEY, JSON.stringify(contact));
    setIsGuest(true);
    setGuestContact(contact);

    // Capture lead in database — fire and forget, guest continues either way
    try {
      await supabase.from('guest_contacts').upsert({
        name:  contact.name,
        phone: contact.phone,
        email: contact.email || null,
        source: 'guest_login',
        visited_at: new Date().toISOString(),
      }, { onConflict: 'phone' });
    } catch (err) {
      console.warn('Guest contact capture failed (non-blocking):', err);
    }
  }

  function exitGuestMode() {
    localStorage.removeItem(GUEST_KEY);
    sessionStorage.removeItem(GUEST_CONTACT_KEY);
    setIsGuest(false);
  }

  // Mark a captured guest as converted once they create a real account
  async function markGuestConverted(phone) {
    if (!phone) return;
    try {
      await supabase.from('guest_contacts')
        .update({ converted_to_user: true })
        .eq('phone', phone);
    } catch (err) {
      console.warn('Guest conversion mark failed (non-blocking):', err);
    }
  }

  // ── Sign Up ──────────────────────────────────────────────────
  async function signUp({ email, password, fullName, phone }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Create profile row
    const { error: profileError } = await supabase.from('profiles').insert({
      id:        data.user.id,
      full_name: fullName,
      email,
      phone:     phone || '',
      city:      'Nairobi, Kenya',
      role:      'customer',
    });
    if (profileError) throw profileError;

    return data.user;
  }

  // ── Sign In ──────────────────────────────────────────────────
  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }

  // ── Update Profile ───────────────────────────────────────────
  async function updateProfile(updates) {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }

  // ── Refresh Profile ──────────────────────────────────────────
  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  // ── Sign Out ─────────────────────────────────────────────────
  async function logout() {
    exitGuestMode();
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, signUp, signIn, logout, updateProfile, refreshProfile,
      isGuest, guestContact, continueAsGuest, exitGuestMode, markGuestConverted,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
