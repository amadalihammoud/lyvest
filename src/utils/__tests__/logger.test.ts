import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, analyticsLogger, paymentLogger, createLogger } from '../logger';

describe('Logger System', () => {
    let consoleSpy: any;

    beforeEach(() => {
        // Spy no console para verificar se logs são chamados
        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => { }),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
            error: vi.spyOn(console, 'error').mockImplementation(() => { }),
            debug: vi.spyOn(console, 'debug').mockImplementation(() => { }),
        };
    });

    describe('Logger em Desenvolvimento', () => {
        it('deve logar mensagens info', () => {
            logger.info('Teste de info');

            // Em dev, deve ter chamado console.log
            expect(consoleSpy.log).toHaveBeenCalled();

            // Verificar que contém timestamp e nível
            const callArgs = consoleSpy.log.mock.calls[0];
            expect(callArgs[0]).toContain('[INFO]');
        });

        it('deve logar mensagens warn', () => {
            logger.warn('Teste de warning');
            expect(consoleSpy.warn).toHaveBeenCalled();

            const callArgs = consoleSpy.warn.mock.calls[0];
            expect(callArgs[0]).toContain('[WARN]');
        });

        it('deve logar mensagens error', () => {
            const error = new Error('Erro de teste');
            logger.error('Erro aconteceu', error);

            expect(consoleSpy.error).toHaveBeenCalled();
            const callArgs = consoleSpy.error.mock.calls[0];
            expect(callArgs[0]).toContain('[ERROR]');
        });

        it('deve logar mensagens debug', () => {
            logger.debug('Debug info', { foo: 'bar' });
            expect(consoleSpy.debug).toHaveBeenCalled();
        });
    });

    describe('Loggers com Prefixo', () => {
        it('analyticsLogger deve ter prefixo [Analytics]', () => {
            analyticsLogger.info('Tracking event');

            const callArgs = consoleSpy.log.mock.calls[0];
            expect(callArgs[0]).toContain('[Analytics]');
        });

        it('paymentLogger deve ter prefixo [Payment]', () => {
            paymentLogger.info('Payment processed');

            const callArgs = consoleSpy.log.mock.calls[0];
            expect(callArgs[0]).toContain('[Payment]');
        });

        it('logger customizado deve usar prefixo fornecido', () => {
            const customLogger = createLogger('CustomModule');
            customLogger.info('Custom message');

            const callArgs = consoleSpy.log.mock.calls[0];
            expect(callArgs[0]).toContain('[CustomModule]');
        });
    });

    describe('Formatação de Timestamp', () => {
        it('deve incluir timestamp em formato HH:MM:SS', () => {
            logger.info('Test');

            const callArgs = consoleSpy.log.mock.calls[0];
            const timestamp = callArgs[0];

            // Verificar formato: XX:XX:XX
            expect(timestamp).toMatch(/\d{2}:\d{2}:\d{2}/);
        });
    });

    describe('Group Logging', () => {
        it('deve suportar console.group', () => {
            const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => { });
            const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => { });

            logger.group('Test Group');
            logger.info('Inside group');
            logger.groupEnd();

            expect(groupSpy).toHaveBeenCalledWith('Test Group');
            expect(groupEndSpy).toHaveBeenCalled();

            groupSpy.mockRestore();
            groupEndSpy.mockRestore();
        });
    });

    describe('Logger Desabilitado', () => {
        it('não deve logar quando desabilitado manualmente', () => {
            const disabledLogger = createLogger('Disabled', false);

            disabledLogger.info('Should not log');
            disabledLogger.warn('Should not log');
            disabledLogger.error('Should not log');

            // Nenhum console deve ter sido chamado
            expect(consoleSpy.log).not.toHaveBeenCalled();
            expect(consoleSpy.warn).not.toHaveBeenCalled();
            expect(consoleSpy.error).not.toHaveBeenCalled();
        });
    });
});
