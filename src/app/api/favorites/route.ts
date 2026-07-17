import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { favorites } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { db } from '@/server/dbClient';

/**
 * /api/favorites — substitui as queries diretas do browser (supabase-js + RLS).
 * Escopo por usuário aplicado no servidor: sempre WHERE user_id = <Clerk auth()>.
 *
 *  GET    → lista os product_ids favoritos do usuário
 *  POST   → { productId } adiciona (idempotente via UNIQUE) |
 *           { merge: [ids] } sincroniza favoritos locais no login
 *  DELETE → { productId } remove
 */

const postSchema = z.union([
    z.object({ productId: z.string().uuid() }),
    z.object({ merge: z.array(z.string().uuid()).max(100) }),
]);

const deleteSchema = z.object({ productId: z.string().uuid() });

export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    try {
        const rows = await db
            .select({ productId: favorites.productId })
            .from(favorites)
            .where(eq(favorites.userId, userId));
        return NextResponse.json({ favorites: rows.map((r) => r.productId) });
    } catch (e) {
        logError('favorites: erro ao listar', e);
        return NextResponse.json({ message: 'Erro ao carregar favoritos' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const rl = await checkRateLimit(getClientIp(request.headers), 'form');
    if (!rl.success) {
        return NextResponse.json({ message: 'Muitas requisições.' }, { status: 429 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const parsed = postSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });
    }

    try {
        if ('merge' in parsed.data) {
            // Sync no login: insere os locais que ainda não existem (UNIQUE ignora duplicados).
            if (parsed.data.merge.length > 0) {
                await db
                    .insert(favorites)
                    .values(parsed.data.merge.map((productId) => ({ userId, productId })))
                    .onConflictDoNothing();
            }
            const rows = await db
                .select({ productId: favorites.productId })
                .from(favorites)
                .where(eq(favorites.userId, userId));
            return NextResponse.json({ favorites: rows.map((r) => r.productId) });
        }

        await db
            .insert(favorites)
            .values({ userId, productId: parsed.data.productId })
            .onConflictDoNothing();
        return NextResponse.json({ success: true });
    } catch (e) {
        logError('favorites: erro ao adicionar', e);
        return NextResponse.json({ message: 'Erro ao salvar favorito' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });
    }

    try {
        await db
            .delete(favorites)
            .where(and(eq(favorites.userId, userId), eq(favorites.productId, parsed.data.productId)));
        return NextResponse.json({ success: true });
    } catch (e) {
        logError('favorites: erro ao remover', e);
        return NextResponse.json({ message: 'Erro ao remover favorito' }, { status: 500 });
    }
}
