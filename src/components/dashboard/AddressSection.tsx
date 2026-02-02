import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { UserAddress } from '../../types/dashboard';

// Endereço vazio para formulário
const emptyAddress: UserAddress = {
    recipient: '',
    zip_code: '',
    state: '',
    city: '',
    neighborhood: '',
    street: '',
    number: '',
    complement: '',
    is_default: false,
};

export default function AddressSection() {
    const { t } = useI18n();
    const { user } = useAuth();

    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
    const [formData, setFormData] = useState<UserAddress>(emptyAddress);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Carregar endereços do Supabase
    const loadAddresses = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        if (!isSupabaseConfigured()) {
            // Mock data para desenvolvimento
            setAddresses([{
                id: 'mock-1',
                recipient: 'Casa',
                street: 'Av. Presidente Wilson',
                number: '132',
                complement: 'Bloco 3 Apto 5',
                neighborhood: 'José Menino',
                city: 'Santos',
                state: 'SP',
                zip_code: '11065-201',
                is_default: true
            }]);
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) {
                // Se tabela não existe ou outro erro, mostrar lista vazia
                console.warn('Aviso ao carregar endereços:', error.message);
                setAddresses([]);
            } else {
                setAddresses(data || []);
            }
        } catch (err) {
            console.warn('Erro ao carregar endereços:', err);
            setAddresses([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // Reset loading e recarregar quando componente montar
        setIsLoading(true);
        loadAddresses();
    }, [loadAddresses]);

    const handleChange = (field: keyof UserAddress, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const formatCep = (value: string) => {
        let cep = value.replace(/\D/g, '');
        if (cep.length > 8) cep = cep.slice(0, 8);
        if (cep.length > 5) cep = `${cep.slice(0, 5)}-${cep.slice(5)}`;
        return cep;
    };

    // Buscar endereço pelo CEP (ViaCEP)
    const handleCepBlur = async () => {
        const cep = formData.zip_code.replace(/\D/g, '');
        if (cep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    street: data.logradouro || prev.street,
                    neighborhood: data.bairro || prev.neighborhood,
                    city: data.localidade || prev.city,
                    state: data.uf || prev.state,
                }));
            }
        } catch {
            // Silently fail
        }
    };

    const handleEdit = (address: UserAddress) => {
        setEditingAddress(address);
        setFormData({
            ...emptyAddress, // Reset fields first
            ...address
        });
        setIsFormOpen(true);
    };

    const handleNew = () => {
        setEditingAddress(null);
        setFormData(emptyAddress);
        setIsFormOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        // Validação básica
        if (!formData.street || !formData.number || !formData.city || !formData.state || !formData.zip_code) {
            setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios' });
            setIsSaving(false);
            return;
        }

        if (!isSupabaseConfigured()) {
            // Mock para desenvolvimento
            await new Promise(r => setTimeout(r, 1000));
            setMessage({ type: 'success', text: 'Endereço salvo (modo demo)!' });
            setTimeout(() => {
                setIsFormOpen(false);
                setMessage({ type: '', text: '' });
            }, 1500);
            setIsSaving(false);
            return;
        }

        try {
            if (!user) throw new Error('Usuário não autenticado');

            // Se marcar como padrão, desmarcar outros
            if (formData.is_default) {
                await supabase
                    .from('addresses')
                    .update({ is_default: false })
                    .eq('user_id', user.id);
            }

            const addressData = {
                ...formData,
                user_id: user.id,
                zip_code: formData.zip_code.replace(/\D/g, ''),
            };
            // remove id from insert data if present (although formData has it optional)
            if (!editingAddress) delete addressData.id;

            let result;
            if (editingAddress && editingAddress.id) {
                // Atualizar
                result = await supabase
                    .from('addresses')
                    .update(addressData)
                    .eq('id', editingAddress.id)
                    .select()
                    .single();
            } else {
                // Inserir
                result = await supabase
                    .from('addresses')
                    .insert(addressData)
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            setMessage({ type: 'success', text: editingAddress ? 'Endereço atualizado!' : 'Endereço adicionado!' });
            await loadAddresses();

            setTimeout(() => {
                setIsFormOpen(false);
                setMessage({ type: '', text: '' });
            }, 1500);
        } catch (err: unknown) {
            setMessage({ type: 'error', text: (err as Error).message || 'Erro ao salvar endereço' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (address: UserAddress) => {
        if (!confirm('Tem certeza que deseja excluir este endereço?')) return;

        if (!isSupabaseConfigured()) {
            setAddresses(addresses.filter(a => a.id !== address.id));
            return;
        }

        try {
            const { error } = await supabase
                .from('addresses')
                .delete()
                .eq('id', address.id);

            if (error) throw error;
            await loadAddresses();
            setMessage({ type: 'success', text: 'Endereço excluído!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao excluir endereço' });
        }
    };

    const handleSetDefault = async (address: UserAddress) => {
        if (!isSupabaseConfigured() || address.is_default || !user) return;

        try {
            // Desmarcar todos
            await supabase
                .from('addresses')
                .update({ is_default: false })
                .eq('user_id', user.id);

            // Marcar o selecionado
            await supabase
                .from('addresses')
                .update({ is_default: true })
                .eq('id', address.id);

            await loadAddresses();
            setMessage({ type: 'success', text: 'Endereço padrão atualizado!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao definir endereço padrão' });
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-lyvest-100 border-t-[#800020] rounded-full animate-spin" />
            </div>
        );
    }

    // Form view
    if (isFormOpen) {
        return (
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-slate-800 text-xl">
                        {editingAddress ? t('dashboard.addresses.edit') : t('dashboard.addresses.new')}
                    </h3>
                    <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {message.text && (
                    <div className={`py-3 px-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-lyvest-100/30 text-red-600'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-5">
                    {/* Nome do destinatário */}
                    <div>
                        <label htmlFor="addr-recipient" className="text-sm font-bold text-slate-700 mb-2 block">Identificação (ex: Casa, Trabalho)</label>
                        <input
                            id="addr-recipient"
                            type="text"
                            value={formData.recipient}
                            onChange={(e) => handleChange('recipient', e.target.value)}
                            placeholder="Casa, Trabalho, etc."
                            className="w-full px-6 py-3 rounded-full border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* CEP */}
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">{t('dashboard.addresses.zip')} *</label>
                            <input
                                type="text"
                                value={formatCep(formData.zip_code)}
                                onChange={(e) => handleChange('zip_code', e.target.value)}
                                onBlur={handleCepBlur}
                                placeholder="00000-000"
                                className="w-full px-6 py-3 rounded-full border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30 outline-none transition-all"
                            />
                        </div>
                        {/* Estado */}
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">{t('dashboard.addresses.state')} *</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => handleChange('state', e.target.value.toUpperCase().slice(0, 2))}
                                placeholder="SP"
                                maxLength={2}
                                className="w-full px-6 py-3 rounded-full border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30 outline-none transition-all uppercase"
                            />
                        </div>
                        {/* Cidade */}
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">{t('dashboard.addresses.city')} *</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                placeholder="São Paulo"
                                className="w-full px-6 py-3 rounded-full border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Bairro */}
                        <div>
                            <label htmlFor="addr-neighborhood" className="text-sm font-bold text-slate-700 mb-2 block">Bairro *</label>
                            <input
                                id="addr-neighborhood"
                                type="text"
                                value={formData.neighborhood}
                                onChange={(e) => handleChange('neighborhood', e.target.value)}
                                placeholder="Centro"
                                className="w-full px-6 py-3 rounded-full border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30 outline-none transition-all"
                            />
                        </div>
                        {/* Rua */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold text-slate-700 mb-2 block">{t('dashboard.addresses.street')} *</label>
                            <input
                                type="text"
                                value={formData.street}
                                onChange={(e) => handleChange('street', e.target.value)}
                                placeholder="Rua, Avenida, etc."
                                className="w-full px-6 py-3 rounded-full border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Número */}
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">{t('dashboard.addresses.number')} *</label>
                            <input
                                type="text"
                                value={formData.number}
                                onChange={(e) => handleChange('number', e.target.value)}
                                placeholder="123"
                                className="w-full px-6 py-3 rounded-full border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30 outline-none transition-all"
                            />
                        </div>
                        {/* Complemento */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold text-slate-700 mb-2 block">{t('dashboard.addresses.complement')}</label>
                            <input
                                type="text"
                                value={formData.complement || ''}
                                onChange={(e) => handleChange('complement', e.target.value)}
                                placeholder="Apto, Bloco, etc. (opcional)"
                                className="w-full px-6 py-3 rounded-full border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Marcar como padrão */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_default}
                            onChange={(e) => handleChange('is_default', e.target.checked)}
                            className="w-5 h-5 rounded text-lyvest-500 focus:ring-[#800020]"
                        />
                        <span className="text-slate-600 font-medium">Definir como endereço padrão</span>
                    </label>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="px-6 py-3 text-slate-500 hover:bg-slate-50 rounded-full font-medium transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-8 py-3 bg-lyvest-500 text-white font-bold rounded-full hover:bg-lyvest-600 shadow-lg shadow-[#F5E6E8] hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                t('common.save')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // List view
    return (
        <div className="space-y-6 animate-fade-in">
            {message.text && (
                <div className={`py-3 px-4 rounded-xl flex items-center gap-2 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-lyvest-100/30 text-red-600'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((addr) => (
                    <div key={addr.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
                        {addr.is_default && (
                            <span className="absolute top-5 right-5 text-xs font-bold text-lyvest-500 bg-lyvest-100/30 px-3 py-1.5 rounded-full border border-lyvest-100 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                {t('dashboard.addresses.default')}
                            </span>
                        )}

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 rounded-full bg-lyvest-100/30 flex items-center justify-center text-lyvest-500">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg">{addr.recipient || 'Endereço'}</h3>
                        </div>

                        <div className="space-y-1.5 text-sm text-slate-600 mb-6 pl-1">
                            <p className="font-medium">{addr.street}, {addr.number}</p>
                            {addr.complement && <p className="text-slate-400">{addr.complement}</p>}
                            <p>{addr.neighborhood} - {addr.city}/{addr.state}</p>
                            <p className="text-slate-400">{t('dashboard.addresses.zip')}: {addr.zip_code?.replace(/(\d{5})(\d{3})/, '$1-$2')}</p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(addr)}
                                className="flex-1 py-3 px-4 bg-lyvest-500 text-white text-sm font-bold rounded-full hover:bg-lyvest-600 transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#F5E6E8]"
                            >
                                <Edit2 className="w-4 h-4" /> {t('dashboard.addresses.edit')}
                            </button>
                            {!addr.is_default && (
                                <>
                                    <button
                                        onClick={() => handleSetDefault(addr)}
                                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors border border-transparent hover:border-amber-100"
                                        title="Definir como padrão"
                                    >
                                        <Star className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(addr)}
                                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#F5E6E8]/300 hover:bg-lyvest-100/30 rounded-full transition-colors border border-transparent hover:border-red-100"
                                        title={t('dashboard.addresses.delete')}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add New Address Card */}
                <button
                    onClick={handleNew}
                    className="bg-slate-50/50 rounded-[2rem] p-6 border-2 border-dashed border-slate-200 hover:border-lyvest-500 hover:bg-lyvest-100/30/30 transition-all flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-lyvest-500 group h-full min-h-[200px]"
                >
                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform group-hover:shadow-md">
                        <Plus className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-lg">{t('dashboard.addresses.new')}</span>
                </button>
            </div>
        </div>
    );
}
