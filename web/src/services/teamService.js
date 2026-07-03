// Admin Team / Agent management — talks to the server-side /api/admin-team
// (which uses the service role to create/revoke staff accounts). super_admin only.
import { supabase } from '../supabase';

async function call(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/admin-team', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export const listAgents  = ()                                  => call('list').then(r => r.agents || []);
export const createAgent = ({ email, password, full_name, admin_role }) => call('create', { email, password, full_name, admin_role });
export const updateAgentRole = (id, admin_role)                => call('update_role', { id, admin_role });
export const revokeAgent = (id)                                => call('revoke', { id });

// Department roles an agent can hold (label + description for the UI)
export const AGENT_ROLES = [
  { value: 'support',      label: 'Customer & Partner Support', desc: 'Handles complaints, tickets & disputes intake' },
  { value: 'finance',      label: 'Finance & Payments',         desc: 'Payouts, refunds, invoices, reconciliation' },
  { value: 'operations',   label: 'Operations / Dispatch',      desc: 'Live jobs, dispatch, partner ops' },
  { value: 'verification', label: 'Verification / HR',          desc: 'Vets & approves partner credentials' },
  { value: 'trust_safety', label: 'Trust & Safety',             desc: 'Safety incidents, damage & urgent disputes' },
  { value: 'super_admin',  label: 'Super Admin (full access)',  desc: 'Sees & controls everything — grant sparingly' },
];

export const roleLabel = (v) => AGENT_ROLES.find(r => r.value === v)?.label || v || '—';
