import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../hooks/useModal';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, ArrowLeft, ArrowRight } from 'lucide-react';

type ViewType = 'login' | 'recovery';

interface UserData {
    id: string;
    name: string;
    email: string | undefined;
    avatar: string;
}

interface LoginModalProps {
    onLoginSuccess?: (userData: UserData) => void;
}

/**
 * Login modal with email/password and Google authentication
 */
export default function LoginModal({ onLoginSuccess }: LoginModalProps): React.ReactElement {
    const { closeModal, openModal } = useModal();
    const { t } = useI18n();
    const { signIn, signInWithGoogle, resetPassword, isConfigured } = useAuth();
    const navigate = useNavigate();

    const [view, setView] = useState<ViewType>('login');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [recoveryEmail, setRecoveryEmail] = useState<string>('');
    const [recoverySent, setRecoverySent] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await signIn(email, password);
            const data = response.data as { user?: { id: string; email?: string; user_metadata?: Record<string, unknown> } };
            const authError = response.error;

            if (authError) {
                setError(authError.message || 'Erro ao fazer login. Verifique suas credenciais.');
                setIsLoading(false);
                return;
            }

            if (data?.user) {
                if (onLoginSuccess) {
                    onLoginSuccess({
                        id: data.user.id,
                        name: String(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuário'),
                        email: data.user.email,
                        avatar: String(data.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.email || 'U')}&background=FF1493&color=fff&bold=true`)
                    });
                }
                closeModal();
                navigate('/dashboard');
            }
        } catch {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async (): Promise<void> => {
        if (!isConfigured) {
            setError('Login com Google não disponível no modo de demonstração.');
            return;
        }

        setIsLoading(true);
        try {
            const { error: authError } = await signInWithGoogle();
            if (authError) {
                setError(authError.message || 'Erro ao fazer login com Google.');
            }
        } catch {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecoverySubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { error: resetError } = await resetPassword(recoveryEmail);

            if (resetError) {
                setError(resetError.message || 'Erro ao enviar email de recuperação.');
                setIsLoading(false);
                return;
            }

            setRecoverySent(true);
        } catch {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (view === 'recovery') {
        return (
            <div className="p-10">
                <button
                    onClick={() => { setView('login'); setRecoverySent(false); setError(''); }}
                    className="flex items-center gap-2 text-slate-500 hover:text-lyvest-600 font-medium mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Voltar
                </button>

                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-lyvest-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Lock className="w-10 h-10 text-lyvest-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Recuperar Senha</h2>
                    <p className="text-slate-500 text-lg">
                        {!recoverySent
                            ? "Informe seu e-mail para receber as instruções."
                            : "Verifique sua caixa de entrada!"}
                    </p>
                </div>

                {error && (
                    <div className="bg-lyvest-100/30 text-red-600 p-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                {!recoverySent ? (
                    <form className="space-y-6 animate-fade-in" onSubmit={handleRecoverySubmit}>
                        <div>
                            <label htmlFor="recovery-email" className="block text-sm font-semibold text-slate-600 mb-2">
                                E-mail
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="recovery-email"
                                    type="email"
                                    required
                                    value={recoveryEmail}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 h-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] focus:border-transparent transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-lyvest-600 text-white font-bold text-lg rounded-full hover:bg-lyvest-600 hover:shadow-lg hover:scale-[1.02] transition-all transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Recuperar Senha</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="animate-fade-in text-center space-y-6">
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100">
                            Enviamos um link de recuperação para o seu e-mail. Por favor, verifique.
                        </div>
                        <button
                            onClick={() => setView('login')}
                            className="w-full h-12 bg-slate-800 text-white font-bold rounded-full hover:bg-slate-700 transition-colors"
                        >
                            Voltar para o Login
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Login View
    return (
        <div className="p-10">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-lyvest-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                    <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-cookie text-slate-800 mb-2 whitespace-nowrap">Acesse seus mimos</h2>
                <p className="text-[#666666] text-lg font-lato">Entre para ver seus favoritos e pedidos.</p>
            </div>

            {error && (
                <div className="bg-lyvest-100/30 text-red-600 p-3 rounded-xl mb-4 text-sm">
                    {error}
                </div>
            )}

            {!isConfigured && (
                <div className="bg-amber-50 text-amber-700 p-3 rounded-xl mb-4 text-sm border border-amber-200">
                    🧪 Modo demonstração: qualquer email/senha funciona!
                </div>
            )}

            <form className="space-y-6" noValidate onSubmit={handleSubmit}>
                <div className="mb-5">
                    <label className="block text-sm font-semibold text-[#454545] mb-2">{t('modals.login.email')}</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="email"
                            required
                            maxLength={100}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 h-12 rounded-xl border border-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] focus:border-transparent transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>
                </div>
                <div className="mb-2">
                    <label className="block text-sm font-semibold text-[#454545] mb-2">{t('modals.login.password')}</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="password"
                            required
                            maxLength={50}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 h-12 rounded-xl border border-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setView('recovery')}
                        className="text-sm font-bold text-lyvest-600 hover:text-lyvest-600 hover:underline"
                    >
                        Esqueceu sua senha?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 mt-6 bg-gradient-to-r from-lyvest-500 to-lyvest-500 text-white font-bold text-lg rounded-full hover:shadow-lg hover:scale-[1.02] transition-all transform flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        t('modals.login.submit')
                    )}
                </button>

                <div className="flex items-center gap-4 my-6">
                    <div className="h-px bg-[#E0E0E0] flex-1"></div>
                    <span className="text-sm text-[#BDBDBD] font-medium">ou</span>
                    <div className="h-px bg-[#E0E0E0] flex-1"></div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full h-12 flex items-center justify-center gap-2 bg-white border border-[#E0E0E0] rounded-full hover:bg-slate-50 transition-colors disabled:opacity-70"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="text-[#454545] font-medium text-sm">Continuar com Google</span>
                    </button>
                </div>

                <p className="text-center text-sm text-[#666666] mt-6">
                    {t('modals.login.noAccount')} <button type="button" onClick={() => { closeModal(); openModal('register'); }} className="text-lyvest-500 font-bold hover:underline ml-1">{t('modals.login.register')}</button>
                </p>
            </form>
        </div>
    );
}
