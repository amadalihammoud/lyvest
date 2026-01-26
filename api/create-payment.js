/* global process */
export default async function handler(req, res) {
    // Apenas aceita POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, customer, items, orderId } = req.body;

        // Validação básica
        if (!amount || !customer) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Configuração da InfinitePay (Variáveis de Ambiente)
        const API_URL = process.env.INFINITEPAY_API_URL || 'https://api.infinitepay.io/v2';
        const API_KEY = process.env.INFINITEPAY_API_KEY;

        if (!API_KEY) {
            console.error('InfinitePay API Key is missing');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Payload para InfinitePay (Link de Pagamento / Checkout)
        // Nota: A estrutura exata depende da API da InfinitePay.
        // Este é um exemplo genérico baseado em padrões de mercado.
        // Ajuste conforme a documentação oficial da InfinitePay (CloudWalk).
        const payload = {
            amount: Math.round(amount * 100), // Em centavos
            currency: 'BRL',
            order_id: orderId,
            customer: {
                first_name: customer.firstName,
                last_name: customer.lastName,
                email: customer.email,
                phone_number: customer.phone,
                document_number: customer.document // CPF/CNPJ
            },
            items: items.map(item => ({
                id: String(item.id),
                description: item.name,
                amount: Math.round(item.price * 100),
                quantity: item.qty
            })),
            metadata: {
                source: 'ecommerce-tutti-nino'
            }
        };

        // Chamada para a API da InfinitePay
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Ecommerce-Tutti-Nino/1.0'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('InfinitePay API Error:', data);
            throw new Error(data.message || 'Payment provider error');
        }

        // Retorna a URL de checkout para o frontend redirecionar
        return res.status(200).json({
            checkoutUrl: data.checkout_url || data.payment_url, // Ajustar conforme resposta real
            transactionId: data.id
        });

    } catch (error) {
        console.error('Create Payment Error:', error);
        return res.status(500).json({
            error: 'Failed to create payment session',
            details: error.message
        });
    }
}
