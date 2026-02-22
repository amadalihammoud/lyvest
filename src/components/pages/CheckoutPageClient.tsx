'use client';

import { useRouter } from 'next/navigation';

import CheckoutWizard from '@/components/checkout/CheckoutWizard';
import { useI18n } from '@/store/useI18nStore';

export default function CheckoutPageClient() {
    const router = useRouter();
    const { t } = useI18n();

    return (
        <>

            <CheckoutWizard
                onBack={() => router.push('/')}
                onComplete={() => router.push('/')}
            />
        </>
    );
}
