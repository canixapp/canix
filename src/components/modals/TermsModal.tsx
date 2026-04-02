import { ResponsiveModal } from './ResponsiveModal';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function TermsModal({ open, onOpenChange }: Props) {
  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Termos de Uso" maxWidth="max-w-2xl">
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm text-foreground">
        <p className="text-muted-foreground">Última atualização: Março de 2026</p>

        <h3 className="text-base font-semibold">1. Aceitação dos Termos</h3>
        <p>Ao utilizar nosso aplicativo e serviços de agendamento de banho e tosa, você concorda com os presentes Termos de Uso. Caso não concorde, pedimos que não utilize a plataforma.</p>

        <h3 className="text-base font-semibold">2. Serviços Oferecidos</h3>
        <p>Nossa plataforma permite:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Agendamento online de serviços de banho, tosa e estética animal;</li>
          <li>Cadastro de tutores e seus pets;</li>
          <li>Acompanhamento do histórico de atendimentos;</li>
          <li>Envio de fotos e avaliações sobre os serviços.</li>
        </ul>

        <h3 className="text-base font-semibold">3. Cadastro e Responsabilidades do Usuário</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fornecer dados verdadeiros e atualizados;</li>
          <li>Manter a segurança das suas credenciais de acesso;</li>
          <li>Informar dados corretos sobre seus pets (nome, raça, porte);</li>
          <li>Respeitar os horários agendados e comunicar cancelamentos com antecedência.</li>
        </ul>

        <h3 className="text-base font-semibold">4. Agendamentos</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Os agendamentos são criados com status "pendente" e dependem de confirmação via WhatsApp;</li>
          <li>Cancelamentos podem ser feitos pela plataforma, informando o motivo;</li>
          <li>Remarcações estão sujeitas à disponibilidade de horários.</li>
        </ul>

        <h3 className="text-base font-semibold">5. Fotos e Avaliações</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fotos enviadas passam por moderação antes da publicação;</li>
          <li>Avaliações devem refletir experiências reais e respeitar a boa convivência;</li>
          <li>Reservamo-nos o direito de rejeitar conteúdo ofensivo ou inadequado.</li>
        </ul>

        <h3 className="text-base font-semibold">6. Propriedade Intelectual</h3>
        <p>Todo o conteúdo visual, textos e funcionalidades da plataforma são de propriedade do estabelecimento. É proibida a reprodução sem autorização.</p>

        <h3 className="text-base font-semibold">7. Limitação de Responsabilidade</h3>
        <p>Não nos responsabilizamos por danos indiretos, incidentais ou consequentes decorrentes do uso da plataforma, incluindo falhas técnicas temporárias.</p>

        <h3 className="text-base font-semibold">8. Alterações nos Termos</h3>
        <p>Podemos alterar estes termos a qualquer momento. As alterações entram em vigor a partir da publicação na plataforma.</p>

        <h3 className="text-base font-semibold">9. Contato</h3>
        <p>Em caso de dúvidas, entre em contato conosco pelo WhatsApp disponível na plataforma.</p>
      </div>
    </ResponsiveModal>
  );
}
