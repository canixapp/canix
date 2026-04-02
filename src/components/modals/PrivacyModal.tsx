import { ResponsiveModal } from './ResponsiveModal';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PrivacyModal({ open, onOpenChange }: Props) {
  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Política de Privacidade e LGPD" maxWidth="max-w-2xl">
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm text-foreground">
        <p className="text-muted-foreground">Última atualização: Março de 2026</p>
        <p>Esta Política de Privacidade foi elaborada em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>

        <h3 className="text-base font-semibold">1. Dados Coletados</h3>
        <p>Coletamos os seguintes dados pessoais:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Dados do tutor:</strong> nome completo, e-mail, telefone;</li>
          <li><strong>Dados dos pets:</strong> nome, raça, porte;</li>
          <li><strong>Dados de uso:</strong> histórico de agendamentos, avaliações, fotos enviadas;</li>
          <li><strong>Dados técnicos:</strong> endereço IP, tipo de dispositivo e navegador (para segurança e melhorias).</li>
        </ul>

        <h3 className="text-base font-semibold">2. Finalidade do Tratamento</h3>
        <p>Utilizamos seus dados para:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Gerenciar seu cadastro e agendamentos;</li>
          <li>Comunicar confirmações, cancelamentos e novidades via WhatsApp;</li>
          <li>Exibir avaliações e fotos (com moderação prévia) na galeria pública;</li>
          <li>Melhorar a experiência do usuário na plataforma;</li>
          <li>Cumprir obrigações legais.</li>
        </ul>

        <h3 className="text-base font-semibold">3. Base Legal</h3>
        <p>O tratamento de dados é realizado com base no seu <strong>consentimento</strong> (Art. 7º, I da LGPD), coletado no momento do cadastro.</p>

        <h3 className="text-base font-semibold">4. Compartilhamento de Dados</h3>
        <p>Seus dados <strong>não são vendidos</strong> a terceiros. Podem ser compartilhados apenas com:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provedores de infraestrutura tecnológica (servidores, banco de dados) para o funcionamento da plataforma;</li>
          <li>Autoridades públicas, quando exigido por lei.</li>
        </ul>

        <h3 className="text-base font-semibold">5. Segurança</h3>
        <p>Adotamos medidas técnicas e administrativas para proteger seus dados, incluindo criptografia de senhas e controle de acesso baseado em papéis (RBAC).</p>

        <h3 className="text-base font-semibold">6. Seus Direitos (LGPD Art. 18)</h3>
        <p>Você tem direito a:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Confirmar a existência de tratamento de seus dados;</li>
          <li>Acessar seus dados pessoais;</li>
          <li>Corrigir dados incompletos ou desatualizados;</li>
          <li>Solicitar a anonimização ou eliminação de dados desnecessários;</li>
          <li>Revogar o consentimento a qualquer momento;</li>
          <li>Solicitar a portabilidade dos dados.</li>
        </ul>

        <h3 className="text-base font-semibold">7. Retenção de Dados</h3>
        <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após a exclusão da conta, os dados são removidos em até 30 dias, exceto quando necessário para cumprimento de obrigação legal.</p>

        <h3 className="text-base font-semibold">8. Fotos e Avaliações</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fotos enviadas são armazenadas de forma segura e passam por moderação;</li>
          <li>Ao enviar uma foto ou avaliação, você autoriza sua exibição na galeria pública do petshop;</li>
          <li>Você pode solicitar a remoção a qualquer momento.</li>
        </ul>

        <h3 className="text-base font-semibold">9. Consentimento</h3>
        <p>Ao criar sua conta e aceitar esta política, você consente com o tratamento dos seus dados conforme descrito. O registro da data e hora do aceite é armazenado para fins de conformidade.</p>

        <h3 className="text-base font-semibold">10. Contato</h3>
        <p>Para exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato pelo WhatsApp disponível na plataforma.</p>
      </div>
    </ResponsiveModal>
  );
}
