# PawDiary — Roadmap (saúde como núcleo)

Tese: PawDiary é o **caderno de saúde do pet** que lembra, registra e organiza o
custo. Diário de fotos e AI Studio ficam como **aquisição** (conteúdo que as
pessoas compartilham), não como motivo para pagar.

## Fase 1 — Retenção (agora)
- [x] Caderneta de saúde: peso, vacina, vermífugo, veterinário
- [x] **Lembretes de cuidado** (vacina, vermífugo, antipulgas, dirofilariose,
      remédio, veterinário, banho e tosa) com recorrência e notificação local
      nativa às 9h do dia; "Done" registra na caderneta e agenda a próxima dose
- [ ] Lembrete também 3 dias antes para vacina/veterinário (dá tempo de marcar)
- [ ] Deep link da notificação abrindo o pet certo

## Fase 2 — O que justifica o Premium
- [ ] Triagem de sintomas com IA com aviso claro "procure o veterinário quando…"
      (nunca diagnóstico; nos EUA diagnóstico exige VCPR)
- [ ] Exportar prontuário em PDF (para veterinário, seguro, hotel, viagem)
- [ ] Controle de gastos com o pet + estimativa de custo de consulta/procedimento
- [ ] Alertas de peso a partir do histórico (sinal `weight_change` já existe no schema)

## Fase 3 — Aquisição e monetização
- [ ] AI Studio grátis com limite e marca d'água PawDiary (motor orgânico TikTok/Reels)
- [ ] RevenueCat para compra dentro do app no iOS/Android; Stripe segue na web
- [ ] Teste de preço anual US$39,99 vs US$59,99 com 7 dias de trial

## Congelado até haver tração
- Feed social público (problema de rede vazia + exigência de moderação da Apple 1.2)

## Métricas para decidir escalar com anúncio
| Métrica | Meta mínima |
|---|---|
| Lead na lista de espera (Meta Ads) | < US$2 |
| Retenção na 4ª semana | ≥ 20% |
| Trial → pago | ≥ 30% |
| CPI de equilíbrio (US$49,99/ano, Apple 15%) | ≈ receita líquida ÷ instalações por pagante |
