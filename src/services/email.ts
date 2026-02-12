import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY not found. Emails will fail to send.');
}

export const resend = new Resend(resendApiKey || 're_123456789'); // Chave mock para build não quebrar

export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

export async function sendEmail({ to, subject, html, from = 'Ly Vest <nao-responda@lyvest.com.br>' }: EmailPayload) {
    if (!resendApiKey) {
        console.log('Would send email (Mock Mode):', { to, subject });
        return { success: true, id: 'mock-id' };
    }

    try {
        const data = await resend.emails.send({
            from,
            to,
            subject,
            html,
        });
        return { success: true, data };
    } catch (error) {
        console.error('Email Send Error:', error);
        return { success: false, error };
    }
}
