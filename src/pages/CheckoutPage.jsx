// src/pages/CheckoutPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutWizard from '../components/CheckoutWizard';
import SEO from '../components/SEO';
import { useI18n } from '../hooks/useI18n';

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { t } = useI18n();

    return (
        <>
            <SEO
                title={t('checkout.title') || "Checkout"}
                description={t('checkout.description') || "Finalize sua compra na Ly Vest"}
            />
            <CheckoutWizard
                onBack={() => navigate('/')}
                onComplete={() => navigate('/')}
            />
        </>
    );
}







