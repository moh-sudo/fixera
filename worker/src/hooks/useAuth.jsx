import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { sendWelcomeEmail } from '../services/partnerEmailService';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);          // reset loading so ProtectedRoute waits
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    console.log('🔍 fetchProfile called for:', userId);
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      console.log('📦 profile result:', data, 'error:', error?.message);
      setProfile(data ?? null);
    } catch (e) {
      console.warn('fetchProfile failed:', e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password, fullName, phone, fields = {}) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from('workers').insert({
        id:                  data.user.id,
        full_name:           fullName,
        email,
        phone,
        partner_role:        fields.partner_role || 'worker',
        service:             fields.service      || null,
        business_name:       fields.business_name|| null,
        business_type:       fields.business_type|| null,
        vehicle_type:        fields.vehicle_type || null,
        product_category:    fields.product_category || null,
        registration_number: fields.registration_number || null,
        tax_pin:             fields.tax_pin             || null,
        service_area:        fields.service_area        || null,
        water_source:        fields.water_source        || null,
        owner_national_id:   fields.owner_national_id   || null,
        years_in_operation:  fields.years_in_operation  || null,
        status:              'offline',
        rating:              5.0,
        total_jobs:          0,
        earnings:            0,
        onboarding_complete: false,
      });
      // Branded welcome email (non-blocking)
      try { sendWelcomeEmail({ email, full_name: fullName, partner_role: fields.partner_role || 'worker', business_name: fields.business_name }); } catch (_) {}
    }
    return data;
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  // Re-fetch the workers row (e.g. after accepting the partner agreement)
  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
