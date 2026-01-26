// src/services/api.js
// Serviço base para futuras integrações com backend

import { API_URLS } from '../config/constants';

/**
 * Cliente HTTP base com configurações padrão
 */
class ApiClient {
    constructor(baseUrl = API_URLS.BASE) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Faz uma requisição HTTP
     * @param {string} endpoint - Endpoint da API
     * @param {object} options - Opções do fetch
     * @returns {Promise<any>}
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new ApiError(
                    error.message || `HTTP Error: ${response.status}`,
                    response.status,
                    error
                );
            }

            // Retornar null para 204 No Content
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Erro de rede. Verifique sua conexão.', 0, error);
        }
    }

    /**
     * GET request
     */
    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Define header de autorização
     */
    setAuthToken(token) {
        if (token) {
            this.defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.defaultHeaders['Authorization'];
        }
    }
}

/**
 * Erro customizado para respostas de API
 */
export class ApiError extends Error {
    constructor(message, status, data = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }

    /**
     * Verifica se é erro de autenticação
     */
    isUnauthorized() {
        return this.status === 401;
    }

    /**
     * Verifica se é erro de validação
     */
    isValidationError() {
        return this.status === 422;
    }

    /**
     * Verifica se é erro de rate limiting
     */
    isRateLimited() {
        return this.status === 429;
    }
}

// Instância singleton do cliente
export const api = new ApiClient();

// Exportar classe para testes ou instâncias customizadas
export { ApiClient };







