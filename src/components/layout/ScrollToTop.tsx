'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Component that scrolls to top on route change
 */
export default function ScrollToTop(): null {
    const pathname = usePathname();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
