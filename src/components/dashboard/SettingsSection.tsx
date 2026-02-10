import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../hooks/useI18n';
import { useAuth, User } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
// jsPDF is loaded dynamically when needed to reduce bundle size
import { Shield, Lock, Bell, Camera, Download, Trash2, CheckCircle, AlertTriangle, AlertCircle, X, FileText } from 'lucide-react';
import { getUserAvatar } from '../../utils/userUtils';
import { UserAddress, Order } from '../../types/dashboard';

interface SettingsSectionProps {
    user: User;
}

function SettingsSection({ user }: SettingsSectionProps) {
    const { t } = useI18n();
    const router = useRouter();
    const { signOut, user: authUser } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Notification states
    const [notifications, setNotifications] = useState({
        email: true,
        whatsapp: true,
        orders: true,
        promos: true
    });

    const handleAvatarChange = () => {
        alert(t('dashboard.settings.avatar.upload') + ' (Em breve)');
    };

    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (newPassword !== confirmPassword) {
            setErrorMsg('As senhas não coincidem');
            return;
        }

        if (newPassword.length < 6) {
            setErrorMsg('A nova senha deve ter pelo menos 6 caracteres');
            return;
        }

        setIsLoading(true);
        setErrorMsg('');

        try {
            if (isSupabaseConfigured()) {
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) throw error;
            }

            setSuccessMsg('Senha alterada com sucesso!');
            e.currentTarget.reset();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: unknown) {
            setErrorMsg((err as Error).message || 'Erro ao alterar senha');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // LGPD: Exportar dados do usuário em PDF
    const handleExportData = async () => {
        setIsExporting(true);
        setErrorMsg('');

        try {
            // Coletar dados
            const userData: {
                profile: Record<string, unknown>;
                addresses: UserAddress[];
                orders: Order[];
                favorites: unknown[];
            } = {
                profile: {
                    email: authUser?.email || user?.email || '',
                    name: user?.name || '',
                    phone: '',
                    cpf: '',
                    birth_date: '',
                    gender: '',
                },
                addresses: [] as any[],
                orders: [] as any[],
                favorites: [] as any[],
            };

            if (isSupabaseConfigured() && authUser?.id) {
                // Buscar perfil
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profile) {
                    userData.profile = { ...userData.profile, ...profile };
                }

                // Buscar endereços
                const { data: addresses } = await supabase
                    .from('addresses')
                    .select('*')
                    .eq('user_id', authUser.id);
                if (addresses) userData.addresses = addresses;

                // Buscar pedidos
                const { data: orders } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('user_id', authUser.id);
                if (orders) userData.orders = orders as any;

                // Buscar favoritos
                const { data: favorites } = await supabase
                    .from('favorites')
                    .select('*')
                    .eq('user_id', authUser.id);
                if (favorites) userData.favorites = favorites;
            }

            // Criar PDF com import dinâmico (reduz bundle inicial)
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 20;

            // Função auxiliar para adicionar nova página se necessário
            const checkNewPage = (neededSpace = 30) => {
                if (y > 270 - neededSpace) {
                    doc.addPage();
                    y = 20;
                }
            };

            // === CABEÇALHO ===
            doc.setFillColor(255, 20, 147); // Rosa Ly Vest
            doc.rect(0, 0, pageWidth, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('Ly Vest', 15, 18);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Relatório de Dados Pessoais (LGPD)', 15, 28);
            doc.setFontSize(9);
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 15, 28, { align: 'right' });

            y = 50;
            doc.setTextColor(51, 51, 51);

            // === DADOS PESSOAIS ===
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 20, 147);
            doc.text('Dados Pessoais', 15, y);
            y += 8;
            doc.setDrawColor(255, 20, 147);
            doc.line(15, y, pageWidth - 15, y);
            y += 10;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 51, 51);

            const profileFields = [
                { label: 'Nome', value: (userData.profile.full_name as string) || (userData.profile.name as string) },
                { label: 'E-mail', value: userData.profile.email as string },
                { label: 'Telefone', value: (userData.profile.phone as string) || 'Não informado' },
                { label: 'CPF', value: userData.profile.cpf ? `***.***.${(userData.profile.cpf as string).slice(-5)}` : 'Não informado' },
                { label: 'Data de Nascimento', value: userData.profile.birth_date ? new Date(userData.profile.birth_date as string).toLocaleDateString('pt-BR') : 'Não informado' },
                { label: 'Gênero', value: userData.profile.gender === 'male' ? 'Masculino' : userData.profile.gender === 'female' ? 'Feminino' : (userData.profile.gender as string) || 'Não informado' },
            ];

            profileFields.forEach(field => {
                doc.setFont('helvetica', 'bold');
                doc.text(`${field.label}:`, 15, y);
                doc.setFont('helvetica', 'normal');
                doc.text(field.value || '-', 55, y);
                y += 7;
            });

            y += 10;
            checkNewPage();

            // === ENDEREÇOS ===
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 20, 147);
            doc.text('Endereços Cadastrados', 15, y);
            y += 8;
            doc.setDrawColor(255, 20, 147);
            doc.line(15, y, pageWidth - 15, y);
            y += 10;

            doc.setFontSize(10);
            doc.setTextColor(51, 51, 51);

            if (userData.addresses.length === 0) {
                doc.setFont('helvetica', 'italic');
                doc.text('Nenhum endereço cadastrado', 15, y);
                y += 10;
            } else {
                userData.addresses.forEach((addr, index) => {
                    checkNewPage(35);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${addr.recipient || `Endereço ${index + 1}`}${addr.is_default ? ' (Padrão)' : ''}`, 15, y);
                    y += 6;
                    doc.setFont('helvetica', 'normal');
                    doc.text(`${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}`, 15, y);
                    y += 5;
                    doc.text(`${addr.neighborhood} - ${addr.city}/${addr.state} - CEP: ${addr.zip_code}`, 15, y);
                    y += 10;
                });
            }

            y += 5;
            checkNewPage();

            // === PEDIDOS ===
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 20, 147);
            doc.text('Histórico de Pedidos', 15, y);
            y += 8;
            doc.setDrawColor(255, 20, 147);
            doc.line(15, y, pageWidth - 15, y);
            y += 10;

            doc.setFontSize(10);
            doc.setTextColor(51, 51, 51);

            if (userData.orders.length === 0) {
                doc.setFont('helvetica', 'italic');
                doc.text('Nenhum pedido realizado', 15, y);
                y += 10;
            } else {
                userData.orders.forEach(order => {
                    checkNewPage(20);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`Pedido #${order.id}`, 15, y);
                    doc.setFont('helvetica', 'normal');
                    // @ts-expect-error created_at not strictly in Order type but mostly there in DB
                    doc.text(`${order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : '-'} - R$ ${order.total?.toFixed(2) || '0,00'}`, 80, y);
                    y += 8;
                });
            }

            y += 10;
            checkNewPage();

            // === FAVORITOS ===
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 20, 147);
            doc.text('Produtos Favoritos', 15, y);
            y += 8;
            doc.setDrawColor(255, 20, 147);
            doc.line(15, y, pageWidth - 15, y);
            y += 10;

            doc.setFontSize(10);
            doc.setTextColor(51, 51, 51);

            if (userData.favorites.length === 0) {
                doc.setFont('helvetica', 'italic');
                doc.text('Nenhum produto favoritado', 15, y);
            } else {
                doc.setFont('helvetica', 'normal');
                doc.text(`${userData.favorites.length} produto(s) na lista de favoritos`, 15, y);
            }

            // === RODAPÉ ===
            const pageCount = doc.internal.pages.length - 1;
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Este documento foi gerado de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) - Art. 18`,
                    pageWidth / 2,
                    285,
                    { align: 'center' }
                );
                doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, 285, { align: 'right' });
            }

            // Salvar PDF
            doc.save(`meus-dados-Ly Vest-${new Date().toISOString().split('T')[0]}.pdf`);

            setSuccessMsg('PDF exportado com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            setErrorMsg('Erro ao exportar dados. Tente novamente.');
        } finally {
            setIsExporting(false);
        }
    };

    // LGPD: Excluir conta
    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'EXCLUIR') {
            setErrorMsg('Digite EXCLUIR para confirmar');
            return;
        }

        setIsDeleting(true);
        setErrorMsg('');

        try {
            if (isSupabaseConfigured() && authUser?.id) {
                // Deletar dados relacionados primeiro (cascade manual por segurança)
                await supabase.from('favorites').delete().eq('user_id', authUser.id);
                await supabase.from('reviews').delete().eq('user_id', authUser.id);
                await supabase.from('addresses').delete().eq('user_id', authUser.id);
                // Orders são mantidos para histórico fiscal, mas anonimizados
                await supabase.from('orders').update({ user_id: null as any }).eq('user_id', authUser.id);
                // Deletar perfil
                await supabase.from('profiles').delete().eq('id', authUser.id);

                // Nota: A exclusão do usuário do Auth requer função admin
                // Por enquanto, fazemos logout e o user fica inativo
            }

            // Limpar localStorage
            localStorage.removeItem('lyvest_mock_user');
            localStorage.removeItem('Ly Vest_favorites');

            // Logout
            await signOut();

            // Redirecionar
            router.push('/');

        } catch {
            setErrorMsg('Erro ao excluir conta. Entre em contato com o suporte.');
        } finally {
            setIsDeleting(false);
        }
    };

    const notificationOptions = [
        { id: 'orders', label: t('dashboard.settings.notifications.orders'), desc: t('dashboard.settings.notifications.ordersDesc') },
        { id: 'promos', label: t('dashboard.settings.notifications.promos'), desc: t('dashboard.settings.notifications.promosDesc') },
        { id: 'email', label: t('dashboard.settings.notifications.email'), desc: t('dashboard.settings.notifications.emailDesc') },
        { id: 'whatsapp', label: t('dashboard.settings.notifications.whatsapp'), desc: t('dashboard.settings.notifications.whatsappDesc') }
    ];

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Success Message */}
            {successMsg && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-50 animate-slide-down">
                    <CheckCircle className="w-5 h-5" />
                    {successMsg}
                </div>
            )}

            {/* Error Message */}
            {errorMsg && (
                <div className="bg-lyvest-100/30 text-red-600 py-3 px-4 rounded-xl flex items-center gap-2 text-sm font-medium border border-red-100">
                    <AlertCircle className="w-5 h-5" />
                    {errorMsg}
                    <button onClick={() => setErrorMsg('')} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Avatar Management Card */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8">
                <button type="button" className="relative group cursor-pointer" onClick={handleAvatarChange}>
                    <img
                        src={getUserAvatar(user)}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = getUserAvatar({ name: user.name });
                        }}
                        alt={user.name}
                        className="w-28 h-28 rounded-full border-4 border-slate-50 shadow-md group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                    </div>
                    <span className="absolute bottom-0 right-0 bg-lyvest-500 text-white p-2.5 rounded-full shadow-md hover:bg-lyvest-600 transition-colors">
                        <Camera className="w-5 h-5" />
                    </span>
                </button>
                <div className="text-center md:text-left flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{user.name}</h3>
                    <p className="text-slate-500 text-sm mb-4">{user.email || 'email@exemplo.com'}</p>
                    <button
                        onClick={handleAvatarChange}
                        className="text-sm font-bold text-lyvest-500 hover:underline bg-lyvest-100/30 px-4 py-2 rounded-full"
                    >
                        {t('dashboard.settings.avatar.change')}
                    </button>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
                    <div className="p-2 bg-lyvest-100/30 rounded-full text-lyvest-500">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{t('dashboard.settings.security.title')}</h3>
                </div>

                <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    <div className="space-y-2">
                        <label htmlFor="currentPassword" className="text-sm font-bold text-slate-700 ml-1">{t('dashboard.settings.security.currentPassword')}</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="newPassword" className="text-sm font-bold text-slate-700 ml-1">{t('dashboard.settings.security.newPassword')}</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700 ml-1">{t('dashboard.settings.security.confirmPassword')}</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full md:w-auto px-8 py-3 bg-slate-800 text-white font-bold rounded-full hover:bg-slate-700 transition-colors disabled:opacity-70 shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 transform"
                        >
                            {isLoading ? t('dashboard.settings.security.updating') : t('dashboard.settings.security.update')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Notifications Section */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
                    <div className="p-2 bg-lyvest-100/30 rounded-full text-lyvest-500">
                        <Bell className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{t('dashboard.settings.notifications.title')}</h3>
                </div>

                <div className="space-y-6">
                    {notificationOptions.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                            <div>
                                <h4 className="font-bold text-slate-800">{item.label}</h4>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <span className="sr-only">{item.label}</span>
                                <input
                                    type="checkbox"
                                    checked={notifications[item.id as keyof typeof notifications]}
                                    onChange={() => toggleNotification(item.id as keyof typeof notifications)}
                                    className="peer opacity-0 absolute w-0 h-0"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F5E6E8] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lyvest-500"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* LGPD: Privacidade e Dados */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
                    <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                        <Download className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Privacidade e Dados (LGPD)</h3>
                        <p className="text-sm text-slate-500">Gerencie seus dados pessoais</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div>
                            <h4 className="font-bold text-slate-800">Exportar meus dados</h4>
                            <p className="text-sm text-slate-500">Baixe um relatório PDF com todos os seus dados (Art. 18 LGPD)</p>
                        </div>
                        <button
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-70 shadow-md"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Gerando PDF...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4" />
                                    Exportar PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="bg-lyvest-100/30 rounded-[2rem] p-8 border border-red-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-full text-red-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-red-800 text-lg">{t('dashboard.settings.dangerZone.title')}</h3>
                </div>
                <p className="text-sm text-red-600 mb-6">{t('dashboard.settings.dangerZone.text')}</p>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-6 py-2.5 border-2 border-red-300 text-red-600 font-bold rounded-full hover:bg-red-100 transition-colors text-sm flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    {t('dashboard.settings.dangerZone.button')}
                </button>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Conta Permanentemente</h3>
                            <p className="text-slate-600 text-sm">
                                Esta ação é <strong>irreversível</strong>. Todos os seus dados serão excluídos permanentemente, incluindo:
                            </p>
                        </div>

                        <ul className="text-sm text-slate-600 mb-6 space-y-2 bg-lyvest-100/30 p-4 rounded-xl">
                            <li>• Informações de perfil</li>
                            <li>• Endereços salvos</li>
                            <li>• Lista de favoritos</li>
                            <li>• Avaliações de produtos</li>
                        </ul>

                        <div className="mb-6">
                            <label htmlFor="delete-confirm" className="text-sm font-bold text-slate-700 mb-2 block">
                                Digite <span className="text-red-600">EXCLUIR</span> para confirmar:
                            </label>
                            <input
                                id="delete-confirm"
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-lyvest-100/300 focus:ring-4 focus:ring-[#F5E6E8]/30 outline-none"
                                placeholder="EXCLUIR"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText('');
                                    setErrorMsg('');
                                }}
                                className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-full hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || deleteConfirmText !== 'EXCLUIR'}
                                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Excluindo...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Excluir Conta
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(SettingsSection);
