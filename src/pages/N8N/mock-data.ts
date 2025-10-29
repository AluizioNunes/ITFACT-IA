export const mockData = {
  templateInfo: {
    name: 'Template Negócio com Agentes de IA',
    version: 'V8',
    description:
      'Automação de atendimento com IA (OpenAI) e RAG via Supabase, memória de chat em Postgres, controle de fluxo (Switch/Merge/Wait), envio de mensagens pelo Evolution API e suporte a Redis para limpeza de memória.',
  },
  // Resumo de nós e categorias derivado do template JSON
  nodeSummary: {
    totalNodes: 27,
    openaiNodes: 4,
    agentNodes: 1,
    supabaseNodes: 6,
    evolutionApiNodes: 3,
    memoryNodes: 2, // Postgres Chat Memory + Redis Delete
    controlNodes: 5, // Switch, Merge, Wait, Split, Loop
  },
  // Métricas gerais simuladas
  totals: {
    totalWorkflows: 1,
    activeWorkflows: 1,
    failedWorkflows: 0,
    totalExecutions: 2480,
    successfulExecutions: 2420,
    failedExecutions: 60,
  },
  // Conversas e atendimento
  chatStats: {
    activeConversations: 120,
    avgMessagesPerConversation: 8,
    avgAgentResponseSeconds: 4.1,
    leadsNotifiedGroup: 15,
  },
  // Execuções ao longo do tempo (simuladas)
  executionsOverTime: [
    { date: '2025-10-23', count: 280 },
    { date: '2025-10-24', count: 320 },
    { date: '2025-10-25', count: 300 },
    { date: '2025-10-26', count: 360 },
    { date: '2025-10-27', count: 400 },
    { date: '2025-10-28', count: 420 },
    { date: '2025-10-29', count: 400 },
  ],
  // Distribuição de tipos de nó para gráfico de pizza
  nodeTypeDistribution: [
    { type: 'OpenAI', value: 4 },
    { type: 'Agente', value: 1 },
    { type: 'Supabase', value: 6 },
    { type: 'Evolution API', value: 3 },
    { type: 'Memória', value: 2 },
    { type: 'Controle', value: 5 },
    { type: 'Outros', value: 6 }, // sticky notes e utilitários
  ],
  // Desempenho por agente
  agentPerformance: [
    { agent: 'Atendente (Chain/Agent)', tasks: 640, successRate: 0.96, avgResponseSec: 4.3 },
    { agent: 'OpenAI Chat Model', tasks: 520, successRate: 0.98, avgResponseSec: 3.8 },
    { agent: 'Supabase Vector/Histórico', tasks: 820, successRate: 0.95, avgResponseSec: 4.5 },
    { agent: 'Evolution API (Envios)', tasks: 500, successRate: 0.99, avgResponseSec: 2.2 },
  ],
  // Lista de nós principais (resumo)
  nodeList: [
    { name: 'OpenAI Chat Model1', type: 'lmChatOpenAi', category: 'OpenAI', credential: 'N8n', required: true, status: 'OK' },
    { name: 'Embeddings OpenAI', type: 'embeddingsOpenAi', category: 'OpenAI', credential: 'N8n', required: false, status: 'OK' },
    { name: 'Supabase Vector Store', type: 'vectorStoreSupabase', category: 'Supabase', credential: 'Fernanda', required: true, status: 'OK' },
    { name: 'OpenAI Chat Model', type: 'lmChatOpenAi', category: 'OpenAI', credential: 'N8n', required: true, status: 'OK' },
    { name: 'Atendente', type: 'agent', category: 'Agente', credential: '-', required: true, status: 'OK' },
    { name: 'Postgres Chat Memory', type: 'memoryPostgresChat', category: 'Memória', credential: 'Fernanda Postgres', required: true, status: 'OK' },
    { name: 'Switch', type: 'switch', category: 'Controle', credential: '-', required: false, status: 'OK' },
    { name: 'Evolution API', type: 'evolutionApi', category: 'Evolution API', credential: 'EVOLUTION API', required: true, status: 'OK' },
    { name: 'Supabase - Busca Telefone', type: 'supabase', category: 'Supabase', credential: 'Fernanda', required: true, status: 'OK' },
    { name: 'Supabase - Adiciona Chat', type: 'supabase', category: 'Supabase', credential: 'Fernanda', required: false, status: 'OK' },
    { name: 'Supabase - Atualiza Chat', type: 'supabase', category: 'Supabase', credential: 'Fernanda', required: false, status: 'OK' },
    { name: 'Supabase - Cria Histórico', type: 'supabase', category: 'Supabase', credential: 'Fernanda', required: true, status: 'OK' },
    { name: 'Delete Memory (Redis)', type: 'redis', category: 'Memória', credential: '5 Fernanda', required: false, status: 'OK' },
  ],
  // Status de credenciais conforme o template
  credentialsStatus: [
    { name: 'OpenAI', id: 'MFMsCfDM1RfxIWQq', configured: true },
    { name: 'Supabase', id: 'QMJXJISOHmYQl9t0', configured: true },
    { name: 'Postgres', id: 'Dv8E5UqVyPvgfOGV', configured: true },
    { name: 'Evolution API', id: 'KHvWRbASZNRfzD3a', configured: true },
    { name: 'Redis', id: 'E310l1CYVnlNNqDY', configured: true },
  ],
  // Guia de uso (resumo do DOCX)
  guiaUso: [
    { step: 1, title: 'Configurar credenciais', description: 'Defina OpenAI, Supabase, Postgres, Redis e Evolution API nas Credenciais do N8N.' },
    { step: 2, title: 'Importar Template', description: 'O container já importa automaticamente o JSON V8 na inicialização (entrypoint customizado).' },
    { step: 3, title: 'Webhook EVO', description: 'Garanta que o Webhook da Evolution API envia eventos para o fluxo (mensagens, instância e remoteJid).' },
    { step: 4, title: 'Agente de Atendimento', description: 'O nó "Atendente" usa o LLM para dividir e formatar mensagens com regras do negócio.' },
    { step: 5, title: 'Memória de Chat', description: 'Postgres Chat Memory guarda contexto por sessão; Redis é usado para limpeza/expiração.' },
    { step: 6, title: 'RAG com Supabase', description: 'Vector Store consulta documentos relevantes para respostas contextuais ao usuário.' },
    { step: 7, title: 'Notificação de Leads', description: 'Quando aplicável, envia avisos ao grupo com link wa.me do novo lead.' },
  ],
};