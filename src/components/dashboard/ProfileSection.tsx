import { useState, useEffect } from 'react';
import { User, Mail, Smartphone, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
// import { useAuth } from '../../context/AuthContext';
import { useUser } from '@clerk/nextjs';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
// import { User as UserType } from '../../context/AuthContext';

interface ProfileSectionProps {
    user: any; // Relaxed type for compatibility
}

export default function ProfileSection({ user: propUser }: ProfileSectionProps) {
    const { t } = useI18n();
    const { user } = useUser();
    const [profile, setProfile] = useState<any>(null);

    // Fetch profile effect
    useEffect(() => {
        async function fetchProfile() {
            if (user?.id && isSupabaseConfigured()) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (data) setProfile(data);
            }
        }
        fetchProfile();
    }, [user]);

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        birth_date: '',
        gender: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    // Carregar dados do perfil quando disponível
    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || user?.fullName || '',
                phone: profile.phone || '',
                birth_date: (profile.birth_date as string) || '',
                gender: (profile.gender as string) || 'male',
            });
        } else if (user) {
            setFormData(prev => ({
                ...prev,
                full_name: user.fullName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || '',
            }));
        } else if (propUser) {
            setFormData(prev => ({
                ...prev,
                full_name: propUser.user_metadata?.full_name || propUser.email?.split('@')[0] || '',
            }));
        }
    }, [profile, user, propUser]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const formatPhone = (value: string) => {
        // Remove tudo que não é número
        let phone = value.replace(/\D/g, '');
        if (phone.length > 11) phone = phone.slice(0, 11);

        // Formatar
        if (phone.length > 6) {
            phone = `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
        } else if (phone.length > 2) {
            phone = `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
        } else if (phone.length > 0) {
            phone = `(${phone}`;
        }
        return phone;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);

        try {
            if (!isSupabaseConfigured()) {
                // Modo mock - simular sucesso
                await new Promise(resolve => setTimeout(resolve, 1000));
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                setIsSaving(false);
                return;
            }

            if (!user?.id) {
                setError('Usuário não identificado.');
                setIsSaving(false);
                return;
            }

            // Primeiro tentar salvar com gender, se falhar tentar sem
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updateData: any = {
                full_name: formData.full_name,
                phone: formData.phone.replace(/\D/g, ''),
                birth_date: formData.birth_date || null,
                updated_at: new Date().toISOString(),
            };

            // Adicionar gender apenas se tiver valor
            if (formData.gender) {
                updateData.gender = formData.gender;
            }

            // Direct Supabase update
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({ id: user.id, ...updateData })
                .select()
                .single();

            // const { error: updateError } = await updateProfile(updateData); // Removed context call

            if (updateError) {
                // Se o erro for sobre coluna gender, tentar sem ela
                if (updateError.message?.includes('gender')) {
                    const { error: retryError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: user.id,
                            full_name: formData.full_name,
                            phone: formData.phone.replace(/\D/g, ''),
                            birth_date: formData.birth_date || null,
                            updated_at: new Date().toISOString()
                        })
                        .select()
                        .single();

                    if (retryError) {
                        setError('Erro ao salvar. Tente novamente.');
                    } else {
                        setShowSuccess(true);
                        setTimeout(() => setShowSuccess(false), 3000);
                    }
                } else {
                    setError(updateError.message || 'Erro ao salvar. Tente novamente.');
                }
            } else {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    // CPF mascarado (se existir no perfil)
    const maskedCpf = profile?.cpf
        ? `${(profile.cpf as string).slice(0, 3)}.***.***-${(profile.cpf as string).slice(-2)}`
        : '***.***.***-**';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 overflow-hidden">
                {showSuccess && (
                    <div className="bg-green-500 text-white py-3 px-4 text-center font-bold text-sm flex items-center justify-center gap-2 shadow-md rounded-xl mb-6 animate-fade-in">
                        <CheckCircle className="w-5 h-5" />
                        {t('dashboard.profile.success')}
                    </div>
                )}

                {error && (
                    <div className="bg-lyvest-100/30 text-red-600 py-3 px-4 text-center font-medium text-sm flex items-center justify-center gap-2 rounded-xl mb-6 border border-red-100">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Data */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 ml-1">{t('dashboard.profile.personalData')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">{t('dashboard.profile.fullName')}</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => handleChange('full_name', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30/50 outline-none transition-all"
                                        placeholder="Seu nome completo"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">{t('dashboard.profile.cpf')}</label>
                                <input
                                    type="text"
                                    value={maskedCpf}
                                    className="w-full px-6 py-3 rounded-full border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">{t('dashboard.profile.birthDate')}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={(e) => handleChange('birth_date', e.target.value)}
                                        className="w-full pl-12 pr-6 py-3 rounded-full border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30/50 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">{t('dashboard.profile.gender')}</label>
                                <div className="flex gap-4 pt-3 flex-wrap">
                                    <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full transition-colors border ${formData.gender === 'male' ? 'bg-lyvest-100/30 border-lyvest-100 text-lyvest-600' : 'bg-slate-50 border-transparent hover:bg-lyvest-100/30 hover:border-lyvest-100'}`}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="male"
                                            checked={formData.gender === 'male'}
                                            onChange={(e) => handleChange('gender', e.target.value)}
                                            className="text-lyvest-500 focus:ring-[#800020]"
                                        />
                                        <span className="font-medium">{t('dashboard.profile.genderMale')}</span>
                                    </label>
                                    <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full transition-colors border ${formData.gender === 'female' ? 'bg-lyvest-100/30 border-lyvest-100 text-lyvest-600' : 'bg-slate-50 border-transparent hover:bg-lyvest-100/30 hover:border-lyvest-100'}`}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="female"
                                            checked={formData.gender === 'female'}
                                            onChange={(e) => handleChange('gender', e.target.value)}
                                            className="text-lyvest-500 focus:ring-[#800020]"
                                        />
                                        <span className="font-medium">{t('dashboard.profile.genderFemale')}</span>
                                    </label>
                                    <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full transition-colors border ${formData.gender === 'other' ? 'bg-lyvest-100/30 border-lyvest-100 text-lyvest-600' : 'bg-slate-50 border-transparent hover:bg-lyvest-100/30 hover:border-lyvest-100'}`}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="other"
                                            checked={formData.gender === 'other'}
                                            onChange={(e) => handleChange('gender', e.target.value)}
                                            className="text-lyvest-500 focus:ring-[#800020]"
                                        />
                                        <span className="font-medium">{t('dashboard.profile.genderOther')}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Contact Data */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 ml-1">{t('dashboard.profile.contact')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">{t('dashboard.profile.email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={user?.primaryEmailAddress?.emailAddress || propUser?.email || ''}
                                        className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 uppercase text-slate-500 bg-slate-50"
                                        disabled
                                    />
                                </div>
                                <button type="button" className="text-xs text-lyvest-500 font-bold cursor-pointer hover:underline text-right w-full flex justify-end px-2">
                                    {t('dashboard.profile.changeEmail')}
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">{t('dashboard.profile.phone')}</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="tel"
                                        value={formatPhone(formData.phone)}
                                        onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                                        className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30/50 outline-none transition-all"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-8 py-3.5 bg-lyvest-500 text-white font-bold rounded-full hover:bg-lyvest-600 transition-all shadow-lg shadow-[#F5E6E8] flex-1 sm:flex-none flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[#E8C4C8] transform hover:-translate-y-0.5"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {t('common.processing')}
                                </>
                            ) : (
                                t('dashboard.profile.save')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
