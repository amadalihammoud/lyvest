import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logError } from '@/lib/server/logger';
import { legalContent } from '@/server/data/legal';
import { getProductsForContext } from '@/server/providers/products';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Pilar 5: a mensagem do usuário é validada antes de chegar ao modelo. Limites de tamanho
// e de contagem barram payloads abusivos (custo/token) e conteúdo malformado.
const chatBodySchema = z.object({
    messages: z
        .array(
            z
                .object({
                    role: z.enum(['user', 'assistant', 'system']),
                    content: z.string().max(4000).optional(),
                })
                .passthrough()
        )
        .min(1)
        .max(40),
});

// Format legal info for prompt
const policies = `
  ### INFORMAÇÕES DA EMPRESA:
  - Nome: ${legalContent.companyInfo.razaoSocial}
  - Atendimento: ${legalContent.companyInfo.attendance}
  - Contato: ${legalContent.companyInfo.email} / ${legalContent.companyInfo.phone}

  ### POLÍTICAS E REGRAS:
  1. **Envios**: ${legalContent.shippingPolicy.summary}
  2. **Trocas**: ${legalContent.exchangePolicy.summary}
  3. **Pagamentos**: ${legalContent.paymentMethods.join(', ')}

  ### QUANDO O CLIENTE PERGUNTAR SOBRE:
  - **Prazos**: Explique a soma (Postagem + Transporte).
  - **Trocas**: Reforce que a primeira troca por defeito é grátis.
  - **Pagamento**: Mencione o desconto de 5% no Pix.
`;

// NOTA (mesma estratégia do ChatWidget): o app fala o protocolo ANTIGO do AI SDK
// (mensagens com `content`, tools com `parameters`, resposta via toDataStreamResponse).
// O pacote `ai` instalado é v6, cujos TIPOS não expõem mais essa superfície — mantemos
// casts TIPADOS (sem `any`) para preservar o comportamento atual sem mudar o protocolo.
// Migrar cliente+servidor para a API v6 é uma tarefa separada (ver task list).
type StreamTextArgs = Parameters<typeof streamText>[0];
type ToolArgs = Parameters<typeof tool>[0];

export async function POST(req: Request): Promise<Response> {
    // Pilar 4 (Cofre): rota com custo por request (OpenAI) — rate limit antes de tudo.
    const rl = await checkRateLimit(getClientIp(req.headers), 'ai');
    if (!rl.success) {
        return NextResponse.json(
            { error: 'Muitas requisições. Tente novamente em instantes.' },
            { status: 429 }
        );
    }

    // Pilar 5: valida o corpo antes de repassar ao modelo.
    let messages: z.infer<typeof chatBodySchema>['messages'];
    try {
        const parsed = chatBodySchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }
        messages = parsed.data.messages;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    try {
        // Buscar produtos do banco (ou mock)
        const products = await getProductsForContext(10);

        // Formatar catálogo para o prompt
        const productCatalog =
            products.length > 0
                ? products
                      .map(
                          (p) => `
    - *${p.name}* (ID: ${p.id}) - R$ ${p.price.toFixed(2).replace('.', ',')}
      ![${p.name}](${p.image ?? ''})
      ${p.description ?? ''}
      ${p.specs ? `Specs: ${JSON.stringify(p.specs)}` : ''}
    `
                      )
                      .join('\n')
                : 'Nenhum produto encontrado no momento.';

        // "Treinamento" (Contexto) do Chatbot
        const systemPrompt = `
  You are Ly, the AI Personal Stylist for Ly Vest, an elegant intimate fashion store.
  Seu nome é "Ly". Você é a IA da Ly Vest. Seu tom é amigável, sofisticado e prestativo.

  ### CONTEXTO DA LOJA (POLÍTICAS):
  ${policies}

  ### REGRAS VISUAIS (IMPORTANTE):
  1. Quando sugerir um produto, VOCÊ DEVE MOSTRAR A FOTO DELE usando Markdown.
  2. Formato: \`![Nome do Produto](URL_DA_IMAGEM)\`
  3. Coloque a foto logo após o nome do produto.

  ### CATÁLOGO DE PRODUTOS DISPONÍVEIS:
  ${productCatalog}

  ### PRIMITIVAS DE ESTILO:
  - Para conforto: Indique peças de algodão ou modal.
  - Para ocasiões especiais: Indique peças de renda.
  - Se o cliente não souber o tamanho, pergunte medidas de busto/quadril.

  Se o cliente disser "quero comprar" ou "adicione ao carrinho", CHAME A FERRAMENTA \`addToCart\` com o ID do produto.
  `;

        const addToCart = tool({
            description: 'Adicionar produto ao carrinho de compras',
            parameters: z.object({
                productId: z.string().describe('O ID do produto a ser adicionado'),
                quantity: z.number().default(1).describe('Quantidade do produto'),
            }),
            execute: async ({ productId }: { productId: string; quantity: number }) => {
                // O backend apenas registra a intenção, o frontend executa a ação via toolInvocation
                return {
                    added: true,
                    message: `Produto ${productId} preparado para adição.`,
                };
            },
        } as unknown as ToolArgs);

        const result = streamText({
            model: openai('gpt-4o-mini'), // Modelo mais econômico e rápido
            system: systemPrompt,
            messages,
            tools: { addToCart },
        } as unknown as StreamTextArgs);

        return (result as unknown as { toDataStreamResponse: () => Response }).toDataStreamResponse();
    } catch (error) {
        logError('chat: erro ao gerar resposta', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
