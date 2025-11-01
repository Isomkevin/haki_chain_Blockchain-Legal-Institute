import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserType = 'lawyer' | 'ngo' | 'donor';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType;
  organization_name?: string;
  practicing_certificate?: string;
  wallet_address?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bounty {
  id: string;
  ngo_id: string;
  title: string;
  description: string;
  jurisdiction: string;
  category: string;
  funding_goal: number;
  current_funding: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  deadline?: string;
  created_at: string;
  tags: string[];
}

export interface Milestone {
  id: string;
  bounty_id: string;
  title: string;
  description: string;
  amount: number;
  order_index: number;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  due_date?: string;
  evidence_required?: string;
  submitted_evidence?: string;
  submitted_at?: string;
  verified_at?: string;
}

export interface Application {
  id: string;
  bounty_id: string;
  lawyer_id: string;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected';
  applied_at: string;
}

export interface Donation {
  id: string;
  bounty_id: string;
  donor_id?: string;
  amount: number;
  is_anonymous: boolean;
  payment_method: string;
  transaction_hash?: string;
  created_at: string;
}
