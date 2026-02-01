import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Commission {
    id: string;
    order_id: string;
    amount: number;
    status: 'pending' | 'available' | 'paid' | 'cancelled';
    order_total: number;
    created_at: string;
    maturation_date: string;
}

interface AffiliateProfile {
    name: string;
    coupon_code: string;
    commission_rate: number;
}

export default function AffiliateDashboardPage() {
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [profile, setProfile] = useState<AffiliateProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            navigate('/auth'); // Redirect to login if not authenticated
            return;
        }

        // 1. Get Affiliate Profile
        const { data: affData, error: affError } = await supabase
            .from('affiliates')
            .select('name, coupon_code, commission_rate')
            .eq('user_id', user.id)
            .single();

        if (affError || !affData) {
            // Not an affiliate or error
            console.error('Affiliate profile not found:', affError);
            setLoading(false);
            return;
        }

        setProfile(affData);

        // 2. Get Commissions using the RLS policy (filtered by affiliate_id implicitly via subquery or direct logic if set up)
        // Note: The RLS policy we created: "Affiliate View Own Commissions" checks "affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())"
        // So we can simple select * from commissions
        const { data: commData, error: commError } = await supabase
            .from('commissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (commError) {
            console.error('Error loading commissions:', commError);
        } else {
            setCommissions(commData || []);
        }
        setLoading(false);
    }

    const stats = useMemo(() => {
        return {
            pending: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
            available: commissions.filter(c => c.status === 'available').reduce((sum, c) => sum + c.amount, 0),
            paid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
            totalSales: commissions.reduce((sum, c) => c.status !== 'cancelled' ? sum + c.order_total : sum, 0)
        };
    }, [commissions]);

    if (loading) return <div className="p-10 text-center">Carregando painel...</div>;

    if (!profile) {
        return (
            <div className="max-w-4xl mx-auto p-10 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Você ainda não é um parceiro.</h2>
                <p className="text-gray-600 mt-2">Entre em contato conosco para se tornar um afiliado Ly Vest!</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            {/* Header / Banner */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Olá, {profile.name}! 👋</h1>
                <p className="opacity-90 text-lg">Bem-vinda ao seu Painel de Parceira Ly Vest.</p>

                <div className="mt-6 bg-white/20 inline-block p-4 rounded-lg backdrop-blur-sm border border-white/30">
                    <p className="text-sm uppercase tracking-wide opacity-80 mb-1">Seu Cupom Exclusivo</p>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-mono font-bold">{profile.coupon_code}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(profile.coupon_code)}
                            className="bg-white text-rose-600 px-3 py-1 rounded text-sm font-bold hover:bg-gray-100 transition"
                        >
                            Copiar
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                    <p className="text-orange-600 font-medium mb-1">Saldo Pendente</p>
                    <h3 className="text-3xl font-bold text-gray-800">Wait... {stats.pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                    <p className="text-xs text-gray-500 mt-2">Libera 7 dias após entrega</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-green-600">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"></path></svg>
                    </div>
                    <p className="text-green-600 font-medium mb-1">Disponível para Saque</p>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.available.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                    {stats.available > 0 && (
                        <button className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 w-full">
                            Solicitar Saque
                        </button>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                    <p className="text-blue-600 font-medium mb-1">Já Recebido</p>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                    <p className="text-xs text-gray-500 mt-2">Total de vendas: {stats.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            </div>

            {/* Extrato */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800">Extrato de Comissões</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="p-4 font-medium">Data</th>
                                <th className="p-4 font-medium">Venda</th>
                                <th className="p-4 font-medium">Valor da Venda</th>
                                <th className="p-4 font-medium">Sua Comissão</th>
                                <th className="p-4 font-medium">Status / Liberação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {commissions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">Nenhuma venda registrada ainda.</td>
                                </tr>
                            ) : (
                                commissions.map(comm => (
                                    <tr key={comm.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(comm.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4 font-mono text-xs text-gray-500">#{comm.order_id || 'ID'}</td>
                                        <td className="p-4 text-sm">{comm.order_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="p-4 font-bold text-rose-600">
                                            {comm.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={comm.status} date={comm.maturation_date} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status, date }: { status: string, date: string }) {
    const config = {
        pending: { color: 'bg-orange-100 text-orange-800', label: 'Pendente' },
        available: { color: 'bg-green-100 text-green-800', label: 'Disponível' },
        paid: { color: 'bg-blue-100 text-blue-800', label: 'Pago' },
        cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelado' },
    };

    // @ts-ignore
    const { color, label } = config[status] || config.pending;

    return (
        <div className="flex flex-col items-start">
            <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>
                {label}
            </span>
            {status === 'pending' && date && (
                <span className="text-[10px] text-gray-400 mt-1">
                    Libera em: {new Date(date).toLocaleDateString('pt-BR')}
                </span>
            )}
        </div>
    );
}
