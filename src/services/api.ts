
// src/services/api.ts
// Serviço base para futuras integrações com backend

import { API_URLS } from '../config/constants';

interface ApiOptions extends RequestInit {
    headers?: Record<string, string>;
}

/**
 * Erro customizado para respostas de API
 */
export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data: any = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }

    /**
     * Verifica se é erro de autenticação
     */
    isUnauthorized(): boolean {
        return this.status === 401;
    }

    /**
     * Verifica se é erro de validação
     */
    isValidationError(): boolean {
        return this.status === 422;
    }

    /**
     * Verifica se é erro de rate limiting
     */
    isRateLimited(): boolean {
        return this.status === 429;
    }
}

/**
 * Cliente HTTP base com configurações padrão
 */
export class ApiClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;

    constructor(baseUrl: string = API_URLS.BASE) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Faz uma requisição HTTP
     * @param endpoint - Endpoint da API
     * @param options - Opções do fetch
     */
    async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T | null> {
        const url = `${this.baseUrl}${endpoint}`;

        const config: ApiOptions = {
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
    get<T = any>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request<T>(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    post<T = any>(endpoint: string, data: any): Promise<T | null> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    put<T = any>(endpoint: string, data: any): Promise<T | null> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    delete<T = any>(endpoint: string): Promise<T | null> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    /**
     * Define header de autorização
     */
    setAuthToken(token: string | null): void {
        if (token) {
            this.defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.defaultHeaders['Authorization'];
        }
    }
}

// Instância singleton do cliente
export const api = new ApiClient();
