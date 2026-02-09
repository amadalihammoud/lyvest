
'use client';

import { useRouter } from 'next/navigation';
import CheckoutWizard from '@/components/checkout/CheckoutWizard';

export default function CheckoutPageClient() {
    const router = useRouter();

    return (
        <>

            <CheckoutWizard
                onBack={() => router.push('/')}
                onComplete={() => router.push('/')}
            />
        </>
    );
}
