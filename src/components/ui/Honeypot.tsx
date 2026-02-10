import React from 'react';

interface HoneypotProps {
    fieldName?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Honeypot Component - Anti-Spam Trap
 * 
 * Este campo é invisível para usuários humanos mas visível para bots.
 * Se um bot preencher este campo, o formulário deve ser rejeitado.
 * 
 * Uso:
 * 1. Adicione ao formulário: <Honeypot fieldName="confirm_email_address" />
 * 2. Na validação (zod ou submit handler): Se o campo tiver valor, rejeite silenciosamente.
 */
export default function Honeypot({ fieldName = '_gotcha', value, onChange }: HoneypotProps) {
    return (
        <div
            style={{
                opacity: 0,
                position: 'absolute',
                top: 0,
                left: 0,
                height: 0,
                width: 0,
                zIndex: -1,
                overflow: 'hidden'
            }}
            aria-hidden="true"
        >
            <label htmlFor={fieldName}>Please strict leave this field empty</label>
            <input
                id={fieldName}
                name={fieldName}
                type="text"
                value={value}
                onChange={onChange}
                tabIndex={-1}
                autoComplete="off"
            />
        </div>
    );
}
