import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { addresses } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { db } from '@/server/dbClient';

/**
 * /api/addresses — substitui as queries diretas do browser (supabase-js + RLS).
 * Escopo por usuário aplicado no servidor: sempre WHERE user_id = <Clerk auth()>.
 *
 *  GET    → lista endereços do usuário (default primeiro, depois mais recentes)
 *  POST   → cria endereço; se isDefault, zera o default anterior
 *  PUT    → { id, ...campos } atualiza endereço do usuário
 *  DELETE → { id } remove endereço do usuário
 */

const addressFields = {
    recipient: z.string().min(1).max(120),
    zipCode: z.string().min(8).max(9),
    state: z.string().length(2),
    city: z.string().min(1).max(120),
    neighborhood: z.string().min(1).max(120),
    street: z.string().min(1).max(200),
    number: z.string().min(1).max(20),
    complement: z.string().max(120).optional().nullable(),
    isDefault: z.boolean().optional().default(false),
};

const createSchema = z.object(addressFields);
const updateSchema = z.object({ id: z.string().uuid(), ...addressFields });
const deleteSchema = z.object({ id: z.string().uuid() });

export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    try {
        const rows = await db
            .select()
            .from(addresses)
            .where(eq(addresses.userId, userId))
            .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
        return NextResponse.json({ addresses: rows });
    } catch (e) {
        logError('addresses: erro ao listar', e);
        return NextResponse.json({ message: 'Erro ao carregar endereços' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const rl = await checkRateLimit(getClientIp(request.headers), 'form');
    if (!rl.success) return NextResponse.json({ message: 'Muitas requisições.' }, { status: 429 });

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });

    try {
        const { isDefault, ...fields } = parsed.data;
        if (isDefault) {
            await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
        }
        const [created] = await db
            .insert(addresses)
            .values({ ...fields, isDefault, userId })
            .returning();
        return NextResponse.json({ address: created });
    } catch (e) {
        logError('addresses: erro ao criar', e);
        return NextResponse.json({ message: 'Erro ao salvar endereço' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const rl = await checkRateLimit(getClientIp(request.headers), 'form');
    if (!rl.success) return NextResponse.json({ message: 'Muitas requisições.' }, { status: 429 });

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });

    try {
        const { id, isDefault, ...fields } = parsed.data;
        if (isDefault) {
            await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
        }
        const updated = await db
            .update(addresses)
            .set({ ...fields, isDefault })
            .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
            .returning();
        if (updated.length === 0) {
            return NextResponse.json({ message: 'Endereço não encontrado' }, { status: 404 });
        }
        return NextResponse.json({ address: updated[0] });
    } catch (e) {
        logError('addresses: erro ao atualizar', e);
        return NextResponse.json({ message: 'Erro ao atualizar endereço' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });

    try {
        await db
            .delete(addresses)
            .where(and(eq(addresses.id, parsed.data.id), eq(addresses.userId, userId)));
        return NextResponse.json({ success: true });
    } catch (e) {
        logError('addresses: erro ao remover', e);
        return NextResponse.json({ message: 'Erro ao remover endereço' }, { status: 500 });
    }
}
