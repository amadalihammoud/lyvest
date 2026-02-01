// src/services/payment.js
// Serviço para integração com gateways de pagamento

import { PAYMENT_CONFIG } from '../config/constants';
import { paymentLogger } from '../utils/logger';


/**
 * Interface para gateways de pagamento
 * Cada gateway implementa estes métodos
 */
class PaymentService {
    constructor() {
        this.gateway = PAYMENT_CONFIG.DEFAULT_GATEWAY;
    }

    /**
     * Define o gateway a ser usado
     * @param {string} gateway - 'stripe' | 'pagseguro' | 'mercadopago'
     */
    setGateway(gateway) {
        if (PAYMENT_CONFIG.GATEWAYS.includes(gateway)) {
            this.gateway = gateway;
        } else {
            throw new Error(`Gateway não suportado: ${gateway}`);
        }
    }

    /**
     * Cria uma sessão de pagamento (para integração futura)
     * @param {object} orderData - Dados do pedido
     * @returns {Promise<object>} - Sessão de pagamento
     */
    /**
     * Cria uma sessão de pagamento (via Backend Seguro)
     * @param {object} orderData - Dados do pedido
     * @returns {Promise<object>} - Sessão de pagamento
     */
    async createPaymentSession(orderData) {
        paymentLogger.info(`Iniciando pagamento seguro via Backend (${this.gateway})`, orderData);

        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

            // Chamada real para a API Serverless
            const response = await fetch('/api/payment/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            // Tratamento de erro 404 (comum em dev se api não rodar)
            if (!response.ok) {
                if (response.status === 404 && isLocalhost) {
                    paymentLogger.warn('API Backend não encontrada. Usando MOCK local para desenvolvimento.');
                    // Simula delay de rede
                    await new Promise(r => setTimeout(r, 800));
                    return {
                        sessionId: `mock_sess_${Date.now()}`,
                        checkoutUrl: `/checkout?session_id=mock_${Date.now()}&status=success`,
                        status: 'pending'
                    };
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro no servidor: ${response.status}`);
            }

            const result = await response.json();
            return result.data; // A API retorna { success: true, data: { ... } }

        } catch (error) {
            paymentLogger.error('Payment Service Error:', error);
            throw error;
        }
    }

    /**
     * Processa pagamento com cartão (tokenizado)
     * @param {string} sessionId - ID da sessão
     * @param {object} paymentData - Dados do pagamento (token do cartão)
     * @returns {Promise<object>} - Resultado do pagamento
     */
    async processCardPayment(sessionId, paymentData) {
        // Simulação - será substituído por integração real
        paymentLogger.debug(`Processando pagamento (${this.gateway})`, { sessionId, paymentData });

        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            transactionId: `txn_${Date.now()}`,
            status: 'approved',
            message: 'Pagamento aprovado com sucesso',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Gera código PIX
     * @param {object} orderData - Dados do pedido
     * @returns {Promise<object>} - Código PIX
     */
    async generatePixCode(orderData) {
        // Simulação - será substituído por integração real
        paymentLogger.info(`Gerando código PIX (${this.gateway})`, orderData);

        await new Promise(resolve => setTimeout(resolve, 800));

        const pixDiscount = orderData.total * PAYMENT_CONFIG.PIX_DISCOUNT;
        const finalAmount = orderData.total - pixDiscount;

        return {
            pixCode: `00020126580014br.gov.bcb.pix0136${Date.now()}520400005303986540${finalAmount.toFixed(2)}5802BR5907LY VEST6009SAO PAULO62070503***6304`,
            qrCodeUrl: '/pix-qr-placeholder.png',
            amount: finalAmount,
            discount: pixDiscount,
            expiresAt: new Date(Date.now() + 30 * 60000).toISOString() // 30 minutos
        };
    }

    /**
     * Verifica status de um pagamento
     * @param {string} transactionId - ID da transação
     * @returns {Promise<object>} - Status do pagamento
     */
    async checkPaymentStatus(transactionId) {
        // Simulação - será substituído por integração real
        paymentLogger.debug(`Verificando status (${this.gateway})`, transactionId);

        return {
            transactionId,
            status: 'approved',
            paidAt: new Date().toISOString()
        };
    }

    /**
     * Solicita reembolso
     * @param {string} transactionId - ID da transação
     * @param {number} amount - Valor a reembolsar (opcional, total se não informado)
     * @returns {Promise<object>} - Resultado do reembolso
     */
    async requestRefund(transactionId, amount = null) {
        // Simulação - será substituído por integração real
        paymentLogger.info(`Solicitando reembolso (${this.gateway})`, { transactionId, amount });

        return {
            refundId: `ref_${Date.now()}`,
            transactionId,
            amount,
            status: 'pending',
            message: 'Reembolso será processado em até 7 dias úteis'
        };
    }
}

// Instância singleton
export const paymentService = new PaymentService();

// Exportar classe para testes
export { PaymentService };







