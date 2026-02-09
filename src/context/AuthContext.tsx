// src/context/AuthContext.tsx
/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface Profile {
    id: string;
    full_name?: string;
    phone?: string;
    avatar?: string | null;
    [key: string]: unknown;
}

export interface User {
    id: string;
    email?: string;
    name?: string;
    avatar?: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
        [key: string]: any;
    };
    app_metadata?: {
        [key: string]: any;
    };
}

interface AuthResponse {
    data: unknown;
    error: AuthError | null | { message: string };
}

interface AuthContextType {
    user: User | null; // Using defined User type
    profile: Profile | null;
    loading: boolean;
    isConfigured: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<AuthResponse>;
    signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<AuthResponse>;
    signInWithGoogle: () => Promise<AuthResponse>;
    signOut: () => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<AuthResponse>;
    updateProfile: (updates: Record<string, unknown>) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConfigured] = useState(isSupabaseConfigured);

    // Buscar perfil do usuário
    const fetchProfile = useCallback(async (userId: string) => {
        if (!isConfigured) return null;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            // Código PGRST116 = registro não encontrado (normal para novos usuários)
            if (error && error.code !== 'PGRST116') {
                // Ignorar erros de abort (causados pelo React StrictMode)
                if (error.name === 'AbortError' || error.message?.includes('abort')) {
                    return null;
                }
                console.warn('Aviso ao buscar perfil:', error.message);
                return null;
            }
            return data;
        } catch (err: unknown) {
            // Ignorar erros de abort
            if ((err as Error).name === 'AbortError' || (err as Error).message?.includes('abort')) {
                return null;
            }
            console.warn('Aviso ao buscar perfil:', (err as Error).message);
            return null;
        }
    }, [isConfigured]);

    // Inicializar sessão
    useEffect(() => {
        if (!isConfigured) {
            // Modo mock para desenvolvimento - SSR-safe
            if (typeof window !== 'undefined') {
                const mockUser = localStorage.getItem('lyvest_mock_user');
                if (mockUser) {
                    try {
                        const parsed = JSON.parse(mockUser);
                        setUser(parsed);
                        setProfile(parsed);
                    } catch {
                        // Ignorar erro de parse
                    }
                }
            }
            setLoading(false);
            return;
        }

        // Verificar sessão existente
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).then(setProfile);
            }
            setLoading(false);
        });

        // Escutar mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_, session) => {
                setUser(session?.user ?? null);
                if (session?.user) {
                    const profileData = await fetchProfile(session.user.id);
                    setProfile(profileData);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [isConfigured, fetchProfile]);

    // Login com email/senha
    const signIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
        if (!isConfigured) {
            // Modo mock - SSR-safe
            const mockUser = {
                id: 'mock-user-id',
                email,
                name: email.split('@')[0],
                avatar: undefined
            };
            if (typeof window !== 'undefined') {
                localStorage.setItem('lyvest_mock_user', JSON.stringify(mockUser));
            }
            setUser(mockUser);
            setProfile(mockUser);
            return { data: { user: mockUser }, error: null };
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            return { data, error };
        } catch (err: unknown) {
            // Tratar erros de rede/abort
            return {
                data: null,
                error: { message: (err as Error).message || 'Erro de conexão. Tente novamente.' }
            };
        }
    }, [isConfigured]);

    // Registro com email/senha
    const signUp = useCallback(async (email: string, password: string, metadata: Record<string, unknown> = {}): Promise<AuthResponse> => {
        if (!isConfigured) {
            // Modo mock - SSR-safe
            const mockUser = {
                id: 'mock-user-id',
                email,
                name: (metadata.full_name as string) || email.split('@')[0],
                avatar: undefined
            };
            if (typeof window !== 'undefined') {
                localStorage.setItem('lyvest_mock_user', JSON.stringify(mockUser));
            }
            setUser(mockUser);
            setProfile(mockUser);
            return { data: { user: mockUser }, error: null };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });

        // Criar perfil inicial
        if (data?.user && !error) {
            await supabase.from('profiles').insert({
                id: data.user.id,
                full_name: metadata.full_name || '',
                phone: metadata.phone || ''
            });
        }

        return { data, error };
    }, [isConfigured]);

    // Login com Google
    const signInWithGoogle = useCallback(async (): Promise<AuthResponse> => {
        if (!isConfigured) {
            return { data: null, error: { message: 'Supabase não configurado' } };
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/dashboard'
            }
        });
        return { data, error };
    }, [isConfigured]);

    // Logout
    const signOut = useCallback(async () => {
        if (!isConfigured) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('lyvest_mock_user');
            }
            setUser(null);
            setProfile(null);
            return { error: null };
        }

        const { error } = await supabase.auth.signOut();
        if (!error) {
            setUser(null);
            setProfile(null);
        }
        return { error };
    }, [isConfigured]);

    // Recuperar senha
    const resetPassword = useCallback(async (email: string): Promise<AuthResponse> => {
        if (!isConfigured) {
            return { data: null, error: { message: 'Supabase não configurado' } };
        }

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
        return { data, error };
    }, [isConfigured]);

    // Atualizar perfil
    const updateProfile = useCallback(async (updates: Record<string, unknown>): Promise<AuthResponse> => {
        if (!isConfigured || !user) {
            return { data: null, error: { message: 'Não autenticado' } };
        }

        const { data, error } = await supabase
            .from('profiles')
            .upsert({ id: (user as { id: string }).id, ...updates })
            .select()
            .single();

        if (!error && data) {
            setProfile(data);
        }

        return { data, error };
    }, [isConfigured, user]);

    const value = useMemo(() => ({
        user,
        profile,
        loading,
        isConfigured,
        isAuthenticated: Boolean(user),
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateProfile
    }), [user, profile, loading, isConfigured, signIn, signUp, signInWithGoogle, signOut, resetPassword, updateProfile]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}
