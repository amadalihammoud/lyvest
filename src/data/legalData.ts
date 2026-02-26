export interface PolicySection {
    title: string;
    content: string;
    bullets?: string[];
}

export interface PolicyTable {
    headers: string[];
    rows: string[][];
}

export interface PolicyDocument {
    title: string;
    lastUpdated: string;
    intro: string;
    sections: PolicySection[];
    table?: PolicyTable;
}

export const legalContent = {
    companyInfo: {
        razaoSocial: "Ly Vest Moda Feminina LTDA",
        cnpj: "29.015.357/0001-25",
        address: "Av. Ana Costa, 433 - Santos - SP",
        email: "contato@lyvest.com.br",
        phone: "(13) 9 9624-6969",
        attendance: "Respondemos em até 24h úteis"
    },

    faq: [
        {
            question: "Quanto tempo demora para meu pedido chegar?",
            answer: "O prazo total é a soma do nosso prazo de separação (descrito na nossa Política de Envios) + o prazo da transportadora. Você verá a estimativa final no carrinho de compras."
        },
        {
            question: "Quais são as formas de pagamento?",
            answer: "Aceitamos Pix (com aprovação imediata), Cartão de Crédito (podendo parcelar, consulte condições) e Boleto Bancário (aprovação em até 3 dias úteis)."
        },
        {
            question: "Como funciona o Frete Grátis?",
            answer: "Oferecemos frete grátis para compras acima de R$ 199,00 para as regiões Sul e Sudeste. Verifique as condições no carrinho."
        },
        {
            question: "Posso desistir da compra?",
            answer: "Sim! Conforme o Código de Defesa do Consumidor, você tem até 7 dias corridos após o recebimento para solicitar a devolução por arrependimento. O produto deve estar lacrado e sem uso."
        },
        {
            question: "Meu pedido veio errado ou com defeito, e agora?",
            answer: "Não se preocupe! Entre em contato conosco pelo e-mail contato@lyvest.com.br em até 30 dias corridos que resolveremos com a troca ou reembolso, sem custos para você."
        },
        {
            question: "É seguro comprar na Ly Vest?",
            answer: "Sim. Nosso site possui certificado SSL (cadeado de segurança) e seus dados de pagamento são processados por operadoras certificadas, não ficando armazenados conosco."
        }
    ],

    termsAndExchanges: {
        title: "Política de Trocas e Devoluções",
        lastUpdated: "Fevereiro de 2026",
        intro: "A nossa política foi elaborada com base no Código de Defesa do Consumidor (CDC) para garantir transparência, respeito aos seus direitos e, acima de tudo, a segurança e a saúde de todos os nossos clientes.",
        sections: [
            {
                title: "1. Direito de Arrependimento",
                content: "Conforme o Artigo 49 do CDC, você tem o direito de desistir da sua compra online no prazo de até 7 dias corridos, contados a partir do recebimento do pedido.",
                bullets: [
                    "O produto deve ser devolvido na embalagem original.",
                    "O produto não pode apresentar nenhum indício de uso ou lavagem.",
                    "O lacre de segurança e higiene deve estar estritamente intacto."
                ]
            },
            {
                title: "2. Condição Especial para Peças Íntimas",
                content: "Por questões de saúde pública e biossegurança (Artigos 4º, 6º e 8º do CDC), peças íntimas (como calcinhas) possuem regras rigorosas de devolução.",
                bullets: [
                    "Não aceitamos a devolução ou troca de peças íntimas cujo lacre de proteção tenha sido rompido ou violado.",
                    "O rompimento do lacre caracteriza a inviabilidade de revenda do produto, suspendendo o direito de arrependimento para resguardar a saúde da coletividade contra riscos sanitários."
                ]
            },
            {
                title: "3. Produtos com Defeito",
                content: "Se a peça apresentar algum vício ou defeito de fabricação (Artigo 18 do CDC), o rompimento do lacre não anula o seu direito à garantia.",
                bullets: [
                    "Defeitos aparentes: Devem ser reportados imediatamente após a conferência do produto.",
                    "Defeitos ocultos: Se o defeito surgir após o uso ou lavagem (ex: costura desfeita), o prazo para reclamação é de até 30 dias a partir da descoberta.",
                    "A peça defeituosa deverá ser enviada para nossa análise. Constatado o defeito, realizaremos a troca ou o reembolso integral. Peças com defeito são descartadas."
                ]
            },
            {
                title: "4. Resumo das Condições",
                content: "Consulte a tabela abaixo para entender rapidamente o status de cada situação:"
            }
        ],
        table: {
            headers: ["Motivo da Solicitação", "Condição do Lacre", "Status da Devolução"],
            rows: [
                ["Desistência / Arrependimento", "Intacto", "Aceita (Troca ou Reembolso)"],
                ["Desistência / Arrependimento", "Rompido", "Recusada (Risco sanitário)"],
                ["Defeito de Fabricação", "Rompido ou Intacto", "Aceita (Após análise técnica)"]
            ]
        }
    } as PolicyDocument,

    shippingPolicy: {
        title: "Política de Prazos e Envios",
        lastUpdated: "Fevereiro de 2026",
        intro: "Nosso compromisso é garantir que seu pedido chegue com segurança e dentro do prazo estimado. Leia atentamente para entender como funciona cada etapa do envio.",
        sections: [
            {
                title: "1. Prazo de Postagem (Separação)",
                content: "Após a aprovação do pagamento, nosso time tem até 3 dias úteis para separar, embalar e postar seu pedido.",
                bullets: [
                    "Este prazo é necessário para garantir que suas peças sejam cuidadosamente conferidas e embaladas.",
                    "Pedidos feitos após as 18h serão processados a partir do próximo dia útil."
                ]
            },
            {
                title: "2. Prazo de Entrega (Transporte)",
                content: "O prazo exibido no carrinho é uma estimativa calculada pelos Correios ou transportadora parceira.",
                bullets: [
                    "O prazo de entrega começa a contar após a postagem do pedido, não na data do pagamento.",
                    "Prazo estimado: de 3 a 15 dias úteis após a postagem, dependendo da região."
                ]
            },
            {
                title: "3. Código de Rastreio",
                content: "O código de rastreamento será enviado automaticamente para o e-mail cadastrado assim que o pedido for postado.",
                bullets: [
                    "Verifique sua caixa de spam caso não receba o e-mail.",
                    "O rastreamento pode levar até 24h para ser atualizado após a postagem."
                ]
            },
            {
                title: "4. Endereço Incorreto",
                content: "É responsabilidade do cliente preencher o endereço de entrega corretamente.",
                bullets: [
                    "Caso o produto retorne para nós devido a endereço incompleto ou incorreto, o frete de reenvio será cobrado do cliente.",
                    "Confira sempre o CEP e o número do imóvel antes de finalizar a compra."
                ]
            },
            {
                title: "5. Extravios ou Roubos de Carga",
                content: "Em caso de extravio confirmado pela transportadora, a Ly Vest tomará as providências necessárias sem custo para você.",
                bullets: [
                    "Realizaremos o reenvio do pedido sem custos ou o reembolso integral, conforme preferência do cliente.",
                    "Para acionar o seguro de carga, é necessário aguardar o prazo de investigação da transportadora (geralmente 10 dias úteis)."
                ]
            }
        ]
    } as PolicyDocument,

    privacyPolicy: {
        title: "Política de Privacidade",
        lastUpdated: "Fevereiro de 2026",
        intro: "A Ly Vest respeita e protege a privacidade de seus clientes. Esta política descreve como coletamos, usamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).",
        sections: [
            {
                title: "1. Coleta de Dados",
                content: "Coletamos apenas os dados estritamente necessários para a execução da venda e entrega do pedido.",
                bullets: [
                    "Nome completo e CPF (para emissão de Nota Fiscal).",
                    "Endereço de entrega (para envio do pedido).",
                    "E-mail e telefone (para comunicação e atualizações de entrega)."
                ]
            },
            {
                title: "2. Dados de Pagamento",
                content: "Seus dados financeiros são tratados com máxima segurança.",
                bullets: [
                    "Dados de cartão de crédito são criptografados e processados diretamente pelo gateway de pagamento.",
                    "A Ly Vest não armazena números de cartão em seus servidores.",
                    "Transações via Pix são processadas pelo seu banco, sem intermediação de dados sensíveis."
                ]
            },
            {
                title: "3. Compartilhamento de Dados",
                content: "Compartilhamos apenas os dados mínimos necessários com parceiros de confiança.",
                bullets: [
                    "Transportadoras (Correios e parceiros) — para viabilizar a entrega.",
                    "Plataforma de E-commerce — para gestão do pedido.",
                    "Receita Federal — para obrigações fiscais (Nota Fiscal).",
                    "Não vendemos, alugamos ou cedemos seus dados a terceiros para fins de marketing."
                ]
            },
            {
                title: "4. Cookies",
                content: "Utilizamos cookies para melhorar sua experiência de navegação.",
                bullets: [
                    "Cookies essenciais: necessários para o funcionamento do carrinho de compras.",
                    "Cookies analíticos (anônimos): utilizados para entender o comportamento de navegação e melhorar o site.",
                    "Você pode desativar cookies analíticos a qualquer momento nas configurações do seu navegador."
                ]
            },
            {
                title: "5. Seus Direitos (LGPD)",
                content: "Como titular dos dados, você possui os seguintes direitos garantidos por lei.",
                bullets: [
                    "Acesso: solicitar a visualização dos dados que possuímos sobre você.",
                    "Correção: solicitar a correção de dados incompletos ou incorretos.",
                    "Exclusão: solicitar a remoção dos seus dados de nossa base.",
                    "Para exercer qualquer direito, entre em contato pelo e-mail contato@lyvest.com.br."
                ]
            }
        ]
    } as PolicyDocument
};
