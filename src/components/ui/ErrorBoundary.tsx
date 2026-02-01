import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { analytics } from '../../utils/analytics';

interface ErrorBoundaryProps {
    children: ReactNode;
    minimal?: boolean;
    message?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorCode?: string;
}

/**
 * Error boundary component to catch and display React errors gracefully
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ error, errorInfo });

        if (import.meta.env.DEV) {
            console.error("Uncaught error:", error, errorInfo);
        }

        analytics.exception(
            `${error.name}: ${error.message}`,
            true
        );
    }

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.minimal) {
                return (
                    <div className="p-6 bg-lyvest-100/30 border border-red-200 rounded-xl text-center">
                        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-slate-600 font-medium mb-3">
                            {this.props.message || 'Erro ao carregar esta seção'}
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="text-sm text-lyvest-500 hover:underline flex items-center gap-1 mx-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Tentar novamente
                        </button>
                    </div>
                );
            }

            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 w-full max-w-[95vw] lg:max-w-[1600px] flex flex-col relative overflow-hidden border border-slate-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-6">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-lyvest-100/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-8 h-8 text-[#F5E6E8]/300" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800 mb-2">
                                        Ops! Algo deu errado 😭
                                    </h1>
                                    <p className="text-slate-500 max-w-xl text-lg">
                                        Ocorreu um erro inesperado. Nossa equipe foi notificada e
                                        estamos trabalhando para resolver.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                                <button
                                    onClick={this.handleReload}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-lyvest-500 text-white font-bold rounded-xl hover:bg-lyvest-600 transition-all shadow-md active:scale-95"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Tentar Novamente
                                </button>
                                <button
                                    onClick={this.handleGoHome}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    <Home className="w-5 h-5" />
                                    Ir para Início
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-[400px]">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span>▼ Detalhes técnicos (dev)</span>
                            </h3>

                            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-6 font-mono text-sm overflow-auto text-red-600 shadow-inner w-full">
                                {this.state.error ? (
                                    <pre className="whitespace-pre-wrap break-all leading-relaxed">
                                        {this.state.error.toString()}
                                        {'\n'}
                                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                                    </pre>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <p>Nenhum log de erro capturado no momento.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end mt-4 pt-4 border-t border-slate-50">
                            <p className="text-xs font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-md">
                                Código: {this.state.errorCode || 'UNKNOWN_ERROR'}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
