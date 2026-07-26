import { describe, expect, it } from 'vitest';

import { isAuthorizedInternal } from './internalAuth';

/**
 * Gate das rotas internas (ERP/webhooks). O contrato é fail-closed: sem segredo
 * configurado, ninguém entra. Duas rotas já quebraram esse contrato interpolando
 * a env direto no template literal (`Bearer ${process.env.X}` vira a string
 * "Bearer undefined", que é truthy) — os últimos casos aqui travam essa regressão.
 */
describe('isAuthorizedInternal', () => {
    it('aceita quando o valor bate exatamente', () => {
        expect(isAuthorizedInternal('Bearer segredo123', 'Bearer segredo123')).toBe(true);
    });

    it('rejeita quando o valor difere', () => {
        expect(isAuthorizedInternal('Bearer errado', 'Bearer segredo123')).toBe(false);
    });

    it('rejeita quando os comprimentos diferem (sem estourar no timingSafeEqual)', () => {
        expect(() => isAuthorizedInternal('curto', 'muito mais comprido')).not.toThrow();
        expect(isAuthorizedInternal('curto', 'muito mais comprido')).toBe(false);
    });

    it('FAIL-CLOSED: rejeita quando o segredo esperado está vazio', () => {
        expect(isAuthorizedInternal('Bearer qualquer', '')).toBe(false);
    });

    it('FAIL-CLOSED: rejeita quando nada foi enviado', () => {
        expect(isAuthorizedInternal('', 'Bearer segredo123')).toBe(false);
    });

    it('rejeita mesmo quando ambos estão vazios (não é "vazio == vazio")', () => {
        expect(isAuthorizedInternal('', '')).toBe(false);
    });

    // Regressão: o jeito CERTO de chamar quando a env não existe.
    it('rejeita quando a env ausente é tratada com ?? "" (padrão correto)', () => {
        const envAusente = undefined;
        expect(isAuthorizedInternal('Bearer undefined', envAusente ?? '')).toBe(false);
    });

    // Regressão: o jeito ERRADO — documentado como armadilha, não como
    // comportamento aceitável. Se este teste um dia virar `false`, ótimo; ele
    // existe para provar que a proteção depende do CHAMADOR, não do helper.
    it('ARMADILHA: interpolar env ausente cria um segredo válido ("Bearer undefined")', () => {
        const envAusente = undefined;
        const esperadoMalMontado = `Bearer ${envAusente}`; // => "Bearer undefined"
        expect(esperadoMalMontado).toBe('Bearer undefined');
        expect(isAuthorizedInternal('Bearer undefined', esperadoMalMontado)).toBe(true);
    });
});
