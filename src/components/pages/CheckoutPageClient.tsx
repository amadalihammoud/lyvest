
'use client';

import { useRouter } from 'next/navigation';

import CheckoutWizard from '@/components/checkout/CheckoutWizard';
import { useI18n } from '@/context/I18nContext';

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
