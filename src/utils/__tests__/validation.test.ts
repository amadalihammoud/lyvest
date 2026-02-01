import { describe, it, expect } from 'vitest';
import {
    validateCardNumber,
    validateCPF,
    validateEmail,
    validateCEP,
    formatCardNumber,
    formatCPF,
    formatPhone,
    validateForm,
    paymentSchema,
    checkoutSchema
} from '../validation';

describe('Utilitários de Validação', () => {
    describe('validateCardNumber', () => {
        it('deve validar cartão Visa válido', () => {
            const validVisa = '4532015112830366';
            expect(validateCardNumber(validVisa)).toBe(true);
        });

        it('deve validar cartão Mastercard válido', () => {
            const validMastercard = '5425233430109903';
            expect(validateCardNumber(validMastercard)).toBe(true);
        });

        it('deve rejeitar cartão inválido', () => {
            const invalid = '1234567890123456';
            expect(validateCardNumber(invalid)).toBe(false);
        });

        it('deve rejeitar cartão com menos de 16 dígitos', () => {
            expect(validateCardNumber('123456789012')).toBe(false);
        });

        it('deve rejeitar cartão vazio', () => {
            expect(validateCardNumber('')).toBe(false);
        });
    });

    describe('validateCPF', () => {
        it('deve validar CPF válido', () => {
            const validCPF = '12345678909'; // CPF de teste
            expect(validateCPF(validCPF)).toBe(true);
        });

        it('deve validar CPF formatado', () => {
            const validCPF = '123.456.789-09';
            expect(validateCPF(validCPF)).toBe(true);
        });

        it('deve rejeitar CPF inválido', () => {
            const invalidCPF = '12345678900';
            expect(validateCPF(invalidCPF)).toBe(false);
        });

        it('deve rejeitar CPF com todos dígitos iguais', () => {
            expect(validateCPF('111.111.111-11')).toBe(false);
            expect(validateCPF('000.000.000-00')).toBe(false);
        });

        it('deve rejeitar CPF vazio', () => {
            expect(validateCPF('')).toBe(false);
        });
    });

    describe('validateEmail', () => {
        it('deve validar email válido', () => {
            expect(validateEmail('teste@exemplo.com')).toBe(true);
            expect(validateEmail('user.name@company.com.br')).toBe(true);
        });

        it('deve rejeitar email sem @', () => {
            expect(validateEmail('testeexemplo.com')).toBe(false);
        });

        it('deve rejeitar email sem domínio', () => {
            expect(validateEmail('teste@')).toBe(false);
        });

        it('deve rejeitar email vazio', () => {
            expect(validateEmail('')).toBe(false);
        });

        it('deve rejeitar email com espaços', () => {
            expect(validateEmail('teste @exemplo.com')).toBe(false);
        });
    });

    describe('validateCEP', () => {
        it('deve validar CEP válido', () => {
            expect(validateCEP('01310-100')).toBe(true);
            expect(validateCEP('01310100')).toBe(true);
        });

        it('deve rejeitar CEP com menos de 8 dígitos', () => {
            expect(validateCEP('0131010')).toBe(false);
        });

        it('deve rejeitar CEP com mais de 8 dígitos', () => {
            expect(validateCEP('013101000')).toBe(false);
        });

        it('deve rejeitar CEP vazio', () => {
            expect(validateCEP('')).toBe(false);
        });
    });

    describe('Formatadores', () => {
        describe('formatCardNumber', () => {
            it('deve formatar número de cartão com espaços', () => {
                const formatted = formatCardNumber('4532015112830366');
                expect(formatted).toBe('4532 0151 1283 0366');
            });

            it('deve lidar com entrada parcial', () => {
                const formatted = formatCardNumber('4532');
                expect(formatted).toBe('4532');
            });

            it('deve limitar a 16 dígitos', () => {
                const formatted = formatCardNumber('45320151128303661234');
                expect(formatted).toBe('4532 0151 1283 0366');
            });
        });

        describe('formatCPF', () => {
            it('deve formatar CPF', () => {
                const formatted = formatCPF('12345678909');
                expect(formatted).toBe('123.456.789-09');
            });

            it('deve preservar formatação existente', () => {
                const formatted = formatCPF('123.456.789-09');
                expect(formatted).toBe('123.456.789-09');
            });
        });

        describe('formatPhone', () => {
            it('deve formatar telefone celular', () => {
                const formatted = formatPhone('11987654321');
                expect(formatted).toBe('(11) 98765-4321');
            });

            it('deve formatar telefone fixo', () => {
                const formatted = formatPhone('1133334444');
                expect(formatted).toBe('(11) 3333-4444');
            });
        });
    });

    describe('validateForm com Schema Zod', () => {
        describe('paymentSchema', () => {
            it('deve validar dados de pagamento corretos', () => {
                const validData = {
                    cardNumber: '4532015112830366',
                    cardName: 'JOAO DA SILVA',
                    expiry: '12/25',
                    cvv: '123'
                };

                const result = validateForm(paymentSchema, validData);
                expect(result.success).toBe(true);
                expect(result.errors).toEqual({});
            });

            it('deve rejeitar cartão inválido', () => {
                const invalidData = {
                    cardNumber: '1234',
                    cardName: 'JOAO DA SILVA',
                    expiry: '12/25',
                    cvv: '123'
                };

                const result = validateForm(paymentSchema, invalidData);
                expect(result.success).toBe(false);
                expect(result.errors.cardNumber).toBeDefined();
            });

            it('deve rejeitar CVV inválido', () => {
                const invalidData = {
                    cardNumber: '4532015112830366',
                    cardName: 'JOAO DA SILVA',
                    expiry: '12/25',
                    cvv: '12' // Muito curto
                };

                const result = validateForm(paymentSchema, invalidData);
                expect(result.success).toBe(false);
                expect(result.errors.cvv).toBeDefined();
            });
        });

        describe('checkoutSchema', () => {
            it('deve validar dados de checkout completos', () => {
                const validData = {
                    nome: 'João da Silva',
                    email: 'joao@exemplo.com',
                    telefone: '11987654321',
                    cep: '01310-100',
                    rua: 'Av. Paulista',
                    numero: '1000',
                    bairro: 'Bela Vista',
                    cidade: 'São Paulo',
                    estado: 'SP'
                };

                const result = validateForm(checkoutSchema, validData);
                expect(result.success).toBe(true);
            });

            it('deve rejeitar email inválido', () => {
                const invalidData = {
                    nome: 'João da Silva',
                    email: 'email-invalido',
                    telefone: '11987654321',
                    cep: '01310-100'
                };

                const result = validateForm(checkoutSchema, invalidData);
                expect(result.success).toBe(false);
                expect(result.errors.email).toBeDefined();
            });

            it('deve rejeitar CEP inválido', () => {
                const invalidData = {
                    nome: 'João da Silva',
                    email: 'joao@exemplo.com',
                    telefone: '11987654321',
                    cep: '123' // Muito curto
                };

                const result = validateForm(checkoutSchema, invalidData);
                expect(result.success).toBe(false);
                expect(result.errors.cep).toBeDefined();
            });
        });
    });

    describe('Edge Cases', () => {
        it('deve lidar com null gracefully', () => {
            expect(validateEmail(null as any)).toBe(false);
            expect(validateCPF(null as any)).toBe(false);
            expect(validateCEP(null as any)).toBe(false);
        });

        it('deve lidar com undefined gracefully', () => {
            expect(validateEmail(undefined as any)).toBe(false);
            expect(validateCardNumber(undefined as any)).toBe(false);
        });

        it('deve trimmar espaços em branco', () => {
            expect(validateEmail('  teste@exemplo.com  ')).toBe(true);
        });
    });
});
