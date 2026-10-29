import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Profile } from '../types/database';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  signUp: (email: string, pass: string, displayName: string, username: string, phone?: string) => Promise<{ error: any }>;
  signIn: (email: string, pass: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  enableDemoMode: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem('chat_current_user');
      if (saved) {
        try {
          setProfile(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Lỗi lấy profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Đọc tài khoản riêng của thiết bị này từ localStorage
      const savedUser = localStorage.getItem('chat_current_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setProfile(parsed);
          // Đồng bộ lại với local backend để giữ ID chuẩn xác tuyệt đối
          fetch('/api/local/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.user) {
                setProfile(data.user);
                localStorage.setItem('chat_current_user', JSON.stringify(data.user));
              }
            })
            .catch(() => {});
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    // Supabase auth subscription
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const enableDemoMode = () => {
    const randomSeed = Math.random().toString(36).substring(2, 6);
    const fallbackUser: Profile = {
      id: 'demo_' + randomSeed,
      username: 'user_' + randomSeed,
      display_name: 'Khách ' + randomSeed,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=user_${randomSeed}`,
      is_online: true,
    };
    setIsDemoMode(true);
    setProfile(fallbackUser);
    localStorage.setItem('chat_current_user', JSON.stringify(fallbackUser));
  };

  const signUp = async (email: string, pass: string, displayName: string, username: string, phone?: string) => {
    // Nếu chưa cấu hình Supabase Cloud -> Dùng Local Realtime Backend trực tiếp!
    if (!isSupabaseConfigured) {
      try {
        const res = await fetch('/api/local/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.toLowerCase().trim(),
            display_name: displayName.trim(),
            phone: phone || '',
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { error: { message: data.error || 'Lỗi đăng ký tài khoản.' } };
        }

        const registeredUser = data.user as Profile;
        setProfile(registeredUser);
        localStorage.setItem('chat_current_user', JSON.stringify(registeredUser));
        return { error: null };
      } catch (err: any) {
        console.error('Lỗi đăng ký local backend:', err);
        // Fallback lưu local nếu backend bị lỗi mạng
        const localUser: Profile = {
          id: 'usr_' + Date.now(),
          username: username.toLowerCase().trim(),
          display_name: displayName.trim(),
          phone: phone || '',
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username.toLowerCase().trim()}`,
          is_online: true,
        };
        setProfile(localUser);
        localStorage.setItem('chat_current_user', JSON.stringify(localUser));
        return { error: null };
      }
    }

    // Nếu đã cấu hình Supabase Cloud
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return { error: { message: 'Tên người dùng (username) này đã có người sử dụng.' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          display_name: displayName,
          username: username,
          phone: phone || null,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        },
      },
    });

    if (!error && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
        display_name: displayName,
        phone: phone || null,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        is_online: true,
      });
    }

    return { error };
  };

  const signIn = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      // Cho phép đăng nhập nhanh bằng username/email
      const usernameCandidate = email.includes('@') ? email.split('@')[0] : email;
      const res = await fetch('/api/local/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameCandidate,
          display_name: usernameCandidate,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        localStorage.setItem('chat_current_user', JSON.stringify(data.user));
      }
      return { error: null };
    }

    const res = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (!res.error && res.data.user) {
      await supabase.from('profiles').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', res.data.user.id);
    }
    return { error: res.error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured && user) {
      await supabase.from('profiles').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', user.id);
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem('chat_current_user');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!isSupabaseConfigured || !user) {
      if (profile) {
        const updated = { ...profile, ...updates };
        setProfile(updated);
        localStorage.setItem('chat_current_user', JSON.stringify(updated));
        // Cập nhật lên local backend
        fetch('/api/local/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(() => {});
      }
      return { error: null };
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isDemoMode,
        signUp,
        signIn,
        signOut,
        updateProfile,
        enableDemoMode,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
