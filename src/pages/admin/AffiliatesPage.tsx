import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Affiliate {
    id: string;
    name: string;
    coupon_code: string;
    commission_rate: number;
    pix_key: string;
    active: boolean;
}

export default function AffiliatesPage() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        coupon_code: '',
        commission_rate: 10,
        pix_key: ''
    });

    async function fetchAffiliates() {
        setLoading(true);
        const { data, error } = await supabase
            .from('affiliates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching affiliates:', error);
            alert('Erro ao carregar afiliados. Verifique se você é Admin.');
        } else {
            setAffiliates(data || []);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchAffiliates();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.coupon_code) return;

        const { error } = await supabase
            .from('affiliates')
            .insert([{
                name: formData.name,
                coupon_code: formData.coupon_code.toUpperCase(),
                commission_rate: formData.commission_rate,
                pix_key: formData.pix_key
            }]);

        if (error) {
            alert('Erro ao criar: ' + error.message);
        } else {
            alert('Afiliado criado com sucesso!');
            setFormData({ name: '', coupon_code: '', commission_rate: 10, pix_key: '' });
            fetchAffiliates();
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8 text-rose-900">Gerenciamento de Afiliados</h1>

            {/* Cadastro */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-10 border border-rose-100">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span>➕</span> Novo Parceiro
                </h2>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded focus:ring-rose-500 focus:border-rose-500"
                            placeholder="Ex: Maria Blogueira"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cupom (Código)</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded uppercase focus:ring-rose-500 focus:border-rose-500"
                            placeholder="MARIA10"
                            value={formData.coupon_code}
                            onChange={e => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comissão (%)</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded focus:ring-rose-500 focus:border-rose-500"
                            value={formData.commission_rate}
                            onChange={e => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chave Pix</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded focus:ring-rose-500 focus:border-rose-500"
                            placeholder="CPF ou E-mail"
                            value={formData.pix_key}
                            onChange={e => setFormData({ ...formData, pix_key: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-rose-600 text-white p-2 rounded hover:bg-rose-700 transition md:col-span-4 font-bold"
                    >
                        Cadastrar Afiliado
                    </button>
                </form>
            </div>

            {/* Listagem */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-rose-50">
                        <tr>
                            <th className="p-4 border-b font-semibold text-rose-900">Nome</th>
                            <th className="p-4 border-b font-semibold text-rose-900">Cupom</th>
                            <th className="p-4 border-b font-semibold text-rose-900">Comissão</th>
                            <th className="p-4 border-b font-semibold text-rose-900">Pix</th>
                            <th className="p-4 border-b font-semibold text-rose-900">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                        ) : affiliates.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum afiliado cadastrado.</td></tr>
                        ) : (
                            affiliates.map(aff => (
                                <tr key={aff.id} className="hover:bg-gray-50 border-b last:border-0">
                                    <td className="p-4 font-medium">{aff.name}</td>
                                    <td className="p-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">{aff.coupon_code}</span></td>
                                    <td className="p-4">{aff.commission_rate}%</td>
                                    <td className="p-4 text-sm text-gray-600">{aff.pix_key || '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${aff.active ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                            {aff.active ? 'ATIVO' : 'INATIVO'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
