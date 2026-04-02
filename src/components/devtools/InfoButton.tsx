import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

interface InfoButtonProps {
  title: string;
  description: string;
  imageUrl?: string;
  className?: string;
}

export function InfoButton({ title, description, imageUrl, className }: InfoButtonProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const content = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      {imageUrl && (
        <div className="rounded-lg overflow-hidden border border-border/50 bg-muted/30">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto max-h-[200px] object-contain"
          />
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors",
            className
          )}
        >
          <Info className="w-3 h-3" />
        </button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Info className="w-4 h-4 text-primary" />
                </div>
                {title}
              </DialogTitle>
            </DialogHeader>
            {content}
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full rounded-xl mt-2">
              Entendi
            </Button>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors",
            className
          )}
        >
          <Info className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-80 p-4" align="center">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            {title}
          </h4>
          {content}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Pre-defined info content for each section
export const DEV_INFO = {
  usage: {
    title: 'Uso do Sistema',
    description: 'Exibe métricas de performance em tempo real do cliente (navegador) e do backend. Heap JS mostra a memória usada pelo JavaScript, RPM indica requisições por minuto, e o total de registros soma todas as linhas no banco de dados.',
  },
  jobs: {
    title: 'Fila de Tarefas',
    description: 'Mostra tarefas em background como limpeza de dados, envio de notificações e processamento assíncrono. Estados: Pendente (aguardando), Executando (em progresso), Concluído (sucesso) e Falha (erro).',
  },
  webhooks: {
    title: 'Webhooks / Integrações',
    description: 'Status das conexões com serviços externos como autenticação, banco de dados, storage e edge functions. Verde indica online, vermelho indica problemas de conexão.',
  },
  api: {
    title: 'Requisições da API',
    description: 'Log das últimas requisições HTTP feitas ao backend. Útil para debug de erros e análise de performance. Códigos 2xx são sucesso, 4xx são erros do cliente e 5xx são erros do servidor.',
  },
  logs: {
    title: 'Logs do Backend',
    description: 'Registros de eventos do servidor em tempo real. INFO são mensagens normais, WARN são avisos e ERROR são erros que precisam de atenção.',
  },
  errors: {
    title: 'Erros do Frontend',
    description: 'Erros JavaScript capturados no navegador do usuário. Inclui mensagem, arquivo e linha onde ocorreu. Zero erros significa que tudo está funcionando bem!',
  },
  database: {
    title: 'Banco de Dados',
    description: 'Status da conexão com o banco de dados, latência de resposta e contagem de registros por tabela. Latência abaixo de 200ms é considerada boa.',
  },
  tools: {
    title: 'Ferramentas',
    description: 'Ações rápidas para desenvolvimento: copiar ou exportar logs, limpar dados temporários e executar verificações de saúde do sistema.',
  },
  heapJs: {
    title: 'Heap JS (Cliente)',
    description: 'Memória JavaScript alocada pelo navegador para esta aplicação. Valores muito altos podem indicar vazamentos de memória.',
  },
  rpm: {
    title: 'Requisições/min (RPM)',
    description: 'Número de requisições HTTP por minuto. Picos podem indicar polling excessivo ou loops infinitos.',
  },
  totalRows: {
    title: 'Total de Registros',
    description: 'Soma de todas as linhas em todas as tabelas do banco de dados. Útil para monitorar crescimento dos dados.',
  },
};
