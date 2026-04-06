import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Outlet } from "react-router-dom";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class HubErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Hub Uncaught Error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-white dark:bg-[#0D1117] rounded-[2.5rem] border border-red-100 dark:border-red-900/20 shadow-xl">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-8">
            <AlertTriangle size={40} />
          </div>
          
          <h2 className="text-2xl font-black text-[#1E293B] dark:text-white mb-3 italic">
            Ops! Algo deu errado no Hub.
          </h2>
          
          <p className="text-[#64748B] text-center max-w-md mb-8 text-sm font-medium leading-relaxed">
            Houve uma falha inesperada ao renderizar esta seção do Centro de Controle. 
            Nossa equipe foi notificada e estamos trabalhando no reparo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <button
              onClick={this.handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#2F7FD3] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-[#1E3A8A] transition-all"
            >
              <RotateCcw size={16} /> Tentar Novamente
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 dark:bg-gray-800 text-[#64748B] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all border border-transparent"
            >
              <Home size={16} /> Voltar ao Início
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-10 p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-gray-800 w-full overflow-hidden text-left">
              <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-2">Debug Info (apenas dev):</p>
              <code className="text-[11px] text-red-500 block break-words whitespace-pre-wrap">
                {this.state.error?.toString()}
              </code>
            </div>
          )}
        </div>
      );
    }

    return this.props.children || <Outlet />;
  }
}

export default HubErrorBoundary;
