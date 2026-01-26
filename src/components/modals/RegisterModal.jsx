import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../hooks/useModal';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, FileText } from 'lucide-react';

export default function RegisterModal() {
    const { closeModal, openModal } = useModal();
    const { signUp, signInWithGoogle, isConfigured } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cpf, setCpf] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const handleCpfChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        setCpf(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validar checkbox de termos
        if (!acceptedTerms) {
            setError('Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.');
            return;
        }

        setIsLoading(true);

        try {
            const { data, error: authError } = await signUp(email, password, {
                full_name: name,
                cpf: cpf.replace(/\D/g, ''),
            });

            if (authError) {
                if (authError.message?.includes('already registered')) {
                    setError('Este e-mail já está cadastrado. Tente fazer login.');
                } else {
                    setError(authError.message || 'Erro ao criar conta. Tente novamente.');
                }
                setIsLoading(false);
                return;
            }

            if (data?.user) {
                // Verifica se o usuário já está confirmado (confirmação de email desabilitada)
                // Se email_confirmed_at existe, vai direto para o dashboard
                if (data.user.email_confirmed_at || data.session) {
                    closeModal();
                    navigate('/dashboard');
                } else {
                    // Precisa confirmar email
                    setRegistrationSuccess(true);
                }
            }
        } catch {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        if (!isConfigured) {
            setError('Cadastro com Google não disponível no modo de demonstração.');
            return;
        }

        setIsLoading(true);
        try {
            const { error: authError } = await signInWithGoogle();
            if (authError) {
                setError(authError.message || 'Erro ao cadastrar com Google.');
            }
        } catch {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    // Tela de sucesso - email de confirmação enviado
    if (registrationSuccess) {
        return (
            <div className="px-10 py-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Verifique seu e-mail!</h2>
                <p className="text-slate-600 mb-6">
                    Enviamos um link de confirmação para <strong className="text-lyvest-600">{email}</strong>.<br />
                    Clique no link para ativar sua conta.
                </p>
                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm mb-6 border border-amber-200">
                    📧 Não recebeu? Verifique sua pasta de spam ou lixo eletrônico.
                </div>
                <button
                    onClick={() => { closeModal(); openModal('login'); }}
                    className="w-full h-11 bg-gradient-to-r from-lyvest-500 to-lyvest-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
                >
                    Ir para Login
                </button>
            </div>
        );
    }

    return (
        <div className="px-10 py-8">
            <div className="text-center mb-6">
                <div className="w-[60px] h-[60px] bg-lyvest-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                    <User className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-cookie text-lyvest-500 mb-1">Faça parte do clube</h2>
                <p className="text-[#666666] text-sm font-lato">Preencha seus dados para acessar seus mimos.</p>
            </div>

            {error && (
                <div className="bg-lyvest-100/30 text-red-600 p-3 rounded-xl mb-4 text-sm">
                    {error}
                </div>
            )}

            {!isConfigured && (
                <div className="bg-amber-50 text-amber-700 p-3 rounded-xl mb-4 text-sm border border-amber-200">
                    🧪 Modo demonstração: qualquer dado é aceito!
                </div>
            )}

            <form className="space-y-4" noValidate onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                    {/* Nome Completo */}
                    <div>
                        <label htmlFor="register-name" className="block text-sm font-semibold text-[#454545] mb-1">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="register-name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 h-11 rounded-xl border border-[#E0E0E0] focus:outline-none focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8] transition-all"
                                placeholder="Seu nome"
                            />
                        </div>
                    </div>

                    {/* CPF */}
                    <div>
                        <label htmlFor="register-cpf" className="block text-sm font-semibold text-[#454545] mb-1">CPF</label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="register-cpf"
                                type="text"
                                required
                                value={cpf}
                                onChange={handleCpfChange}
                                maxLength={14}
                                className="w-full pl-12 pr-4 h-11 rounded-xl border border-[#E0E0E0] focus:outline-none focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8] transition-all"
                                placeholder="000.000.000-00"
                            />
                        </div>
                    </div>

                    {/* E-mail */}
                    <div>
                        <label htmlFor="register-email" className="block text-sm font-semibold text-[#454545] mb-1">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="register-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 h-11 rounded-xl border border-[#E0E0E0] focus:outline-none focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8] transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    {/* Senha */}
                    <div>
                        <label htmlFor="register-password" className="block text-sm font-semibold text-[#454545] mb-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="register-password"
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 h-11 rounded-xl border border-[#E0E0E0] focus:outline-none focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8] transition-all"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                    </div>
                </div>

                {/* Termos (Checkbox) */}
                <div className="flex items-start gap-3 mt-3">
                    <div className="flex items-center h-5">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="w-5 h-5 border border-slate-300 rounded focus:ring-[#800020] text-lyvest-600 cursor-pointer focus:ring-offset-0 focus:ring-[#F5E6E8] accent-[#600018]"
                        />
                    </div>
                    <label htmlFor="terms" className="text-sm text-slate-600 leading-tight cursor-pointer">
                        Li e concordo com os <button type="button" onClick={() => openModal('terms')} className="text-lyvest-500 hover:underline">Termos de Uso</button> e <button type="button" onClick={() => openModal('privacy')} className="text-lyvest-500 hover:underline">Política de Privacidade</button>.
                    </label>
                </div>

                {/* Botão Cadastrar */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 mt-5 bg-gradient-to-r from-lyvest-500 to-lyvest-500 text-white font-bold text-lg rounded-full hover:shadow-lg hover:scale-[1.02] transition-all transform flex items-center justify-center font-lato cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        'Cadastrar'
                    )}
                </button>

                {/* Divisor */}
                <div className="flex items-center gap-4 my-4">
                    <div className="h-px bg-[#E0E0E0] flex-1"></div>
                    <span className="text-sm text-[#BDBDBD] font-medium">ou cadastre-se com</span>
                    <div className="h-px bg-[#E0E0E0] flex-1"></div>
                </div>

                {/* Botão Google */}
                <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={isLoading}
                    className="w-full h-11 flex items-center justify-center gap-2 bg-white border border-[#E0E0E0] rounded-full hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-70"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span className="text-[#454545] font-medium text-sm">Continuar com Google</span>
                </button>

                <p className="text-center text-sm text-[#666666] mt-4">
                    Já tem uma conta? <button type="button" onClick={() => openModal('login')} className="text-lyvest-500 font-bold hover:underline ml-1">Entrar</button>
                </p>
            </form>
        </div>
    );
}







