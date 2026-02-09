'use client';
import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, ShoppingBag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useCart } from '../../hooks/useCart';
import { useModal } from '../../hooks/useModal';
import { productsData } from '../../data/mockData';

// Custom type for simplified ToolInvocation
interface ToolInvocation {
    toolName: string;
    toolCallId: string;
    args: any;
}

export default function ChatWidget() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        initialMessages: [
            {
                id: 'welcome-v3',
                role: 'assistant',
                content: 'Oi! Sou a Ly, assistente digital da Ly Vest.\n\nComo posso ajudar hoje?'
            }
        ]
    } as any) as any; // Cast to any to avoid generic type complex conflicts for now if strict mode is harsh

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const quickReplies: string[] = ["Ajuda com Tamanhos", "Ideias de Presente", "Falar com Humano"];

    const handleQuickReply = (text: string) => {
        const event = {
            target: { value: text }
        } as React.ChangeEvent<HTMLInputElement>;
        handleInputChange(event);
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-24 right-6 z-[95] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:ring-offset-2 bg-[#800020] text-white
                    ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
                aria-label="Falar com a Ly"
            >
                <Sparkles className="h-6 w-6 animate-pulse" />
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 left-4 right-4 z-[95] flex h-[450px] max-h-[45vh] flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slide-up sm:bottom-28 sm:left-auto sm:right-6 sm:max-h-[80vh] sm:h-[510px] sm:w-[440px] border border-stone-100">
                    <div className="flex items-center justify-between bg-gradient-to-r from-[#800020] to-[#600018] p-4 text-white shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full shadow-inner overflow-hidden bg-white">
                                    <img src="/ly-avatar.png" alt="Ly" className="h-full w-full object-cover scale-110" />
                                </div>
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-[#800020]"></span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Ly</h3>
                                <p className="text-xs text-white/80">Sua Consultora Digital</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-1.5 transition-colors hover:bg-white/10 active:scale-95"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 scrollbar-hide bg-gradient-to-b from-slate-50 to-white">
                        <div className="flex flex-col gap-4">
                            {messages.length === 0 && (
                                <div className="flex gap-3 animate-fade-in">
                                    <div className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden shadow-sm bg-white">
                                        <img src="/ly-avatar.png" alt="Ly" className="h-full w-full object-cover scale-110" />
                                    </div>
                                    <div className="flex flex-col gap-1 max-w-[85%]">
                                        <div className="rounded-2xl rounded-tl-none bg-white p-3 text-sm text-slate-700 shadow-sm border border-slate-100">
                                            <p>Oi! Sou a Ly, assistente digital da Ly Vest.<br /><br />Como posso ajudar hoje?</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {messages.map((m: any) => (
                                m.role !== 'system' && (
                                    <div
                                        key={m.id}
                                        className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}
                                    >
                                        {m.role !== 'user' && (
                                            <div className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden shadow-sm bg-white">
                                                <img src="/ly-avatar.png" alt="Ly" className="h-full w-full object-cover scale-110" />
                                            </div>
                                        )}

                                        <div className={`flex flex-col gap-1 max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div
                                                className={`rounded-2xl p-3 text-sm shadow-sm ${m.role === 'user'
                                                    ? 'bg-[#800020] text-white rounded-tr-none'
                                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none prose prose-sm max-w-none prose-p:my-1 prose-strong:text-[#800020] prose-a:text-[#800020] prose-a:font-bold'
                                                    }`}
                                            >
                                                <ReactMarkdown>{m.content}</ReactMarkdown>

                                                {m.toolInvocations?.map((toolInvocation: ToolInvocation) => {
                                                    const { toolName, toolCallId, args } = toolInvocation;

                                                    if (toolName === 'addToCart') {
                                                        return (
                                                            <div key={toolCallId} className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                                <p className="font-semibold text-slate-700 text-xs mb-2">
                                                                    Sugestão de Compra:
                                                                </p>
                                                                <AddToCartButton productId={args.productId} />
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 animate-fade-in">
                                    <div className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden shadow-sm bg-white">
                                        <img src="/ly-avatar.png" alt="Ly" className="h-full w-full object-cover scale-110" />
                                    </div>
                                    <div className="rounded-2xl rounded-tl-none bg-white p-4 shadow-sm border border-slate-100">
                                        <div className="flex gap-1.5">
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 delay-100"></span>
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 delay-200"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 bg-white p-4">
                        {messages.length < 2 && (
                            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                {quickReplies.map((reply) => (
                                    <button
                                        key={reply}
                                        onClick={() => handleQuickReply(reply)}
                                        className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#800020] hover:bg-white hover:text-[#800020]"
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex gap-2 relative">
                            <input
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Digite sua dúvida..."
                                className="flex-1 rounded-full border border-slate-200 bg-slate-50 pl-4 pr-10 py-2.5 text-sm transition-all focus:border-[#800020] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#800020]/20"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !(input || '').trim()}
                                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#800020] text-white transition-transform hover:bg-[#600018] active:scale-95 disabled:opacity-50 disabled:scale-100"
                            >
                                <Send className="h-3.5 w-3.5 ml-0.5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

interface AddToCartButtonProps {
    productId: string | number;
}

function AddToCartButton({ productId }: AddToCartButtonProps) {
    const { addToCart } = useCart();
    const { openDrawer } = useModal();
    const [added, setAdded] = useState<boolean>(false);

    const handleAdd = () => {
        // Safe check for product ID match (string vs number)
        const product = productsData.find((p: any) => String(p.id) === String(productId));

        if (product) {
            addToCart(product);
            setAdded(true);
            setTimeout(() => {
                openDrawer('cart');
            }, 300); // Small delay for effect
        } else {
            console.warn('Product not found in context', productId);
        }
    };

    if (added) {
        return (
            <button disabled className='w-full flex items-center justify-center gap-2 bg-green-100 text-green-700 py-2 rounded-md text-xs font-bold cursor-default'>
                <Sparkles className='w-3 h-3' /> Adicionado!
            </button>
        );
    }

    return (
        <button
            onClick={handleAdd}
            className='w-full bg-[#800020] text-white py-2 rounded-md text-xs font-bold hover:bg-[#600018] transition-colors flex items-center justify-center gap-2'
        >
            <ShoppingBag className='w-3 h-3' /> Adicionar ao Carrinho
        </button>
    );
}
