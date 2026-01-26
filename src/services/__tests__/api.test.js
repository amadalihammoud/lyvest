// src/services/__tests__/api.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, ApiError, api } from '../api';

describe('API Service', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('ApiClient', () => {
        it('creates instance with default base URL', () => {
            const client = new ApiClient();
            expect(client.baseUrl).toBeDefined();
        });

        it('creates instance with custom base URL', () => {
            const client = new ApiClient('https://custom-api.com');
            expect(client.baseUrl).toBe('https://custom-api.com');
        });

        it('performs GET request', async () => {
            const mockResponse = { data: 'test' };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const client = new ApiClient('https://api.test.com');
            const result = await client.get('/endpoint');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.test.com/endpoint',
                expect.objectContaining({ method: 'GET' })
            );
            expect(result).toEqual(mockResponse);
        });

        it('performs POST request with body', async () => {
            const mockResponse = { id: 1 };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const client = new ApiClient('https://api.test.com');
            const result = await client.post('/endpoint', { name: 'test' });

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.test.com/endpoint',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ name: 'test' }),
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it('throws ApiError on non-ok response', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({ message: 'Not found' }),
            });

            const client = new ApiClient('https://api.test.com');

            await expect(client.get('/not-found')).rejects.toThrow(ApiError);
        });

        it('handles network errors', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const client = new ApiClient('https://api.test.com');

            await expect(client.get('/endpoint')).rejects.toThrow('Erro de rede');
        });

        it('sets auth token', () => {
            const client = new ApiClient();
            client.setAuthToken('my-token');

            expect(client.defaultHeaders['Authorization']).toBe('Bearer my-token');
        });

        it('removes auth token when null', () => {
            const client = new ApiClient();
            client.setAuthToken('my-token');
            client.setAuthToken(null);

            expect(client.defaultHeaders['Authorization']).toBeUndefined();
        });

        it('returns null for 204 No Content', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 204,
            });

            const client = new ApiClient('https://api.test.com');
            const result = await client.delete('/endpoint');

            expect(result).toBeNull();
        });
    });

    describe('ApiError', () => {
        it('creates error with message and status', () => {
            const error = new ApiError('Not found', 404);
            expect(error.message).toBe('Not found');
            expect(error.status).toBe(404);
            expect(error.name).toBe('ApiError');
        });

        it('detects unauthorized errors', () => {
            const error = new ApiError('Unauthorized', 401);
            expect(error.isUnauthorized()).toBe(true);
        });

        it('detects validation errors', () => {
            const error = new ApiError('Invalid data', 422);
            expect(error.isValidationError()).toBe(true);
        });

        it('detects rate limiting', () => {
            const error = new ApiError('Too many requests', 429);
            expect(error.isRateLimited()).toBe(true);
        });
    });

    describe('api singleton', () => {
        it('exports a singleton instance', () => {
            expect(api).toBeInstanceOf(ApiClient);
        });
    });
});







