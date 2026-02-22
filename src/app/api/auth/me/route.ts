import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                fullName: user.fullName || user.firstName || 'Usuário',
                imageUrl: user.imageUrl,
            }
        });
    } catch (error) {
        console.error('Error fetching user for header:', error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
}
