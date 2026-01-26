// src/context/AuthContext.tsx
/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface Profile {
    id: string;
    full_name?: string;
    phone?: string;
    avatar?: string | null;
    [key: string]: any;
}

interface AuthResponse {
    data: any;
    error: AuthError | null | { message: string };
}

interface AuthContextType {
    user: any | null; // Using any for now to support both Supabase User and mock user
    profile: Profile | null;
    loading: boolean;
    isConfigured: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<AuthResponse>;
    signUp: (email: string, password: string, metadata?: any) => Promise<AuthResponse>;
    signInWithGoogle: () => Promise<AuthResponse>;
    signOut: () => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<AuthResponse>;
    updateProfile: (updates: any) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<any | null>(null);
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
        } catch (err: any) {
            // Ignorar erros de abort
            if (err.name === 'AbortError' || err.message?.includes('abort')) {
                return null;
            }
            console.warn('Aviso ao buscar perfil:', err.message);
            return null;
        }
    }, [isConfigured]);

    // Inicializar sessão
    useEffect(() => {
        if (!isConfigured) {
            // Modo mock para desenvolvimento
            const mockUser = localStorage.getItem('tutti_mock_user');
            if (mockUser) {
                try {
                    const parsed = JSON.parse(mockUser);
                    setUser(parsed);
                    setProfile(parsed);
                } catch {
                    // Ignorar erro de parse
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
            async (event, session) => {
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
            // Modo mock
            const mockUser = {
                id: 'mock-user-id',
                email,
                name: email.split('@')[0],
                avatar: null
            };
            localStorage.setItem('tutti_mock_user', JSON.stringify(mockUser));
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
        } catch (err: any) {
            // Tratar erros de rede/abort
            return {
                data: null,
                error: { message: err.message || 'Erro de conexão. Tente novamente.' }
            };
        }
    }, [isConfigured]);

    // Registro com email/senha
    const signUp = useCallback(async (email: string, password: string, metadata: any = {}): Promise<AuthResponse> => {
        if (!isConfigured) {
            // Modo mock
            const mockUser = {
                id: 'mock-user-id',
                email,
                name: metadata.full_name || email.split('@')[0],
                avatar: null
            };
            localStorage.setItem('tutti_mock_user', JSON.stringify(mockUser));
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
                redirectTo: `${window.location.origin}/dashboard`
            }
        });
        return { data, error };
    }, [isConfigured]);

    // Logout
    const signOut = useCallback(async () => {
        if (!isConfigured) {
            localStorage.removeItem('tutti_mock_user');
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
    const updateProfile = useCallback(async (updates: any): Promise<AuthResponse> => {
        if (!isConfigured || !user) {
            return { data: null, error: { message: 'Não autenticado' } };
        }

        const { data, error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...updates })
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
