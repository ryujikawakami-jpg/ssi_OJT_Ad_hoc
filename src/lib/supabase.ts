import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "implicit",
    // navigator.locks のロック競合を回避するカスタム実装
    lock: async <R,>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
      return await fn();
    },
  },
});
