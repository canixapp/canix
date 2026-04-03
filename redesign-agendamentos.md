# Plano de Implementação: Redesign Bento-Style Agendamentos

Este documento descreve as etapas para transformar a página de Agendamentos em uma interface de alta fidelidade, seguindo o estilo Bento-Grid e priorizando a clareza visual sem perder a funcionalidade atual.

## 🎨 DESIGN COMMITMENT: BENTO-PETCÃO PREMIUM

- **Geometria:** Bordas extremamente arredondadas (`rounded-3xl` / 24px) para os containers principais e cards, criando um visual amigável e moderno.
- **Topologia:** Layout em blocos (Bento) para o resumo do dia, e cards visuais espaçados para a lista de agendamentos.
- **Paleta:** Fiel ao PetCão (Azul Primário #0A7AE6 e Laranja Secundário), com uso intenso de `bg-surface-2` para camadas.
- **Movimento:** Revelação estagiada (staggered reveal) usando Framer Motion e feedbacks físicos nos botões (escala e brilho).
- **Unicidade:** Abandono do visual de "tabela/lista simples" em favor de cards que parecem objetos físicos sobre uma superfície.

---

## 🛠️ ETAPAS DE IMPLEMENTAÇÃO

### Fase 1: Fundação e Estrutura (Topologia)
1. **Header Reestilizado:** Transformar o título e ações principais em um cabeçalho mais limpo e flutuante.
2. **Day Overview (Bento):** Criar a grade de indicadores do dia (Total, Próximo, Ocupação) com cards de diferentes pesos visuais.

### Fase 2: Componente Service Card (O Coração da Página)
1. **Reforma do Card:**
   * Implementar avatar grande para o pet.
   * Chip de horário em destaque com fundo contrastante.
   * Badge de status com cores vibrantes e bordas suaves.
   * Ações rápidas (WhatsApp, Editar) integradas de forma discreta (hover/ícone).

### Fase 3: Interatividade e Filtros
1. **Barra de Busca e Filtros:** Fundir a busca e os filtros em uma barra integrada com design de pílula (`rounded-full`).
2. **Animações de Transição:** Aplicar `AnimatePresence` para trocas de categorias de status, para que os cards deslizem suavemente.

### Fase 4: Modais e Finalização
1. **Polimento de Modais:** Adaptar os modais de "Novo Agendamento" e "Remarcar" para o novo padrão de raios e tipografia.
2. **Testes de Usabilidade:** Garantir que a lógica de busca por telefone e integração com Supabase permaneça 100% funcional.

---

## 🚦 CRITÉRIOS DE VERIFICAÇÃO

- [ ] A página passa no "Teste do Wow" ao carregar as animações?
- [ ] O porte do pet (Pequeno, Médio, Grande) está visualmente fácil de identificar?
- [ ] O botão do WhatsApp continua funcionando e abrindo com a mensagem correta?
- [ ] A performance continua fluida mesmo com muitos cards (uso de memoização)?

---
> 🔴 **MAESTRO AUDITOR:** "Se parecer uma tabela do Excel, eu falhei. Se parecer um dashboard da Apple, eu venci."
