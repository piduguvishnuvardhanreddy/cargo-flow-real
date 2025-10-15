import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'driver' | 'customer';

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  return data.role as UserRole;
};

export const getAllUserRoles = async (userId: string): Promise<UserRole[]> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  if (error || !data) return [];
  return data.map(r => r.role as UserRole);
};
