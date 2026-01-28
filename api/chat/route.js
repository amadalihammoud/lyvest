import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getProductsForContext } from '../_services/products.js';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

import { legalContent } from '../_data/legal.js';

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

export async function POST(req) {
  const { messages } = await req.json();

  // Buscar produtos do banco (ou mock)
  const products = await getProductsForContext(10);

  // Formatar catálogo para o prompt
  const productCatalog = products.length > 0
    ? products.map(p => `
    - *${p.name}* (ID: ${p.id}) - R$ ${p.price.toFixed(2).replace('.', ',')}
      ![${p.name}](${p.image})
      ${p.description}
      Specs: ${JSON.stringify(p.specs || {})}
    `).join('\n')
    : "Nenhum produto encontrado no momento.";

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

  const result = await streamText({
    model: openai('gpt-4o-mini'), // Modelo mais econômico e rápido
    system: systemPrompt,
    messages,
    tools: {
      addToCart: tool({
        description: 'Adicionar produto ao carrinho de compras',
        parameters: z.object({
          productId: z.string().describe('O ID do produto a ser adicionado'),
          quantity: z.number().default(1).describe('Quantidade do produto'),
        }),
        execute: async ({ productId }) => {
          // O backend apenas registra a intenção, o frontend executa a ação via toolInvocation
          return {
            added: true,
            message: `Produto ${productId} preparado para adição.`
          };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
