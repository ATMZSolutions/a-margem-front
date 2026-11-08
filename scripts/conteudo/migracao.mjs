import { hash } from './inventario.mjs';

export function verificarManifesto(manifesto) {
  const { sha256, ...dados } = manifesto;
  if (manifesto.versao !== 1 || hash(JSON.stringify(dados)) !== sha256) throw new Error('Manifesto inválido ou alterado; gere novamente o inventário');
  if (manifesto.ausentes.length || manifesto.conteudo.conflitos.length) throw new Error('Inventário contém arquivos ausentes ou conflitos de conteúdo');
  if (manifesto.midias.some((midia) => midia.erro || !midia.formato)) throw new Error('Inventário contém mídia sem formato validado');
}

// Decisão compartilhável pelo futuro executor: nunca sobrescreve edição posterior.
export function decidirImportacao(hashFonte, estado) {
  if (!estado) return 'criar';
  if (estado.hashDestinoAtual !== estado.hashDestinoImportado) return 'conflito';
  return hashFonte === estado.hashFonteImportada ? 'ignorar' : 'atualizar';
}

export function planejarMigracao(manifesto, ambiente) {
  if (!['local', 'staging', 'producao'].includes(ambiente)) throw new Error('Ambiente obrigatório: local, staging ou producao');
  verificarManifesto(manifesto);
  const objetos = new Map();
  for (const midia of manifesto.midias.filter((item) => item.referencias.length || item.url === '/favicon.ico')) {
    const extensao = midia.formato === 'jpeg' ? 'jpg' : midia.formato;
    const anterior = objetos.get(midia.sha256);
    if (anterior) anterior.origens.push(midia.url);
    else objetos.set(midia.sha256, { sha256: midia.sha256, chave: `originais/${midia.sha256}.${extensao}`, bytes: midia.bytes, origens: [midia.url], acao: 'verificar-destino-antes-de-enviar' });
  }
  for (const midia of manifesto.banco?.midias ?? []) {
    const anterior = objetos.get(midia.sha256);
    if (anterior) anterior.origens.push(midia.chaveOrigem);
    else objetos.set(midia.sha256, { sha256: midia.sha256, bytes: midia.bytes, origens: [midia.chaveOrigem], acao: 'validar-formato-do-blob-antes-de-enviar' });
  }
  const entidadesBanco = Object.entries(manifesto.banco?.registros ?? {}).flatMap(([dominio, itens]) => itens.map((item) => ({ dominio, chaveOrigem: item.chaveOrigem, hashFonte: hash(JSON.stringify(item)), acao: 'conciliar-antes-de-gravar' })));
  const entidades = Object.entries(manifesto.conteudo).filter(([, valor]) => Array.isArray(valor)).filter(([nome]) => nome !== 'conflitos').flatMap(([dominio, itens]) => itens.map((item) => ({ dominio, chaveOrigem: item.chaveOrigem, hashFonte: hash(JSON.stringify(item)), acao: 'conciliar-antes-de-gravar' })));
  const bloqueiosExecucao = [];
  if (manifesto.banco?.estado !== 'snapshot-somente-leitura') bloqueiosExecucao.push('Banco de origem não consultado');
  else if (!manifesto.banco.historicoPresente || !manifesto.banco.migracoes?.length) bloqueiosExecucao.push('Origem sem histórico Prisma; o manifesto não informa o estado do destino');
  else if (manifesto.banco.conferenciaHistorico?.problemas?.length) bloqueiosExecucao.push(...manifesto.banco.conferenciaHistorico.problemas);
  bloqueiosExecucao.push('Dry-run local não verifica schema, grants ou bucket do destino; execute o preflight de staging antes da importação', 'Importação de conteúdo em staging ainda não foi executada');
  return { versao: 1, modo: 'simulacao-local', ambiente, manifestoSha256: manifesto.sha256, objetos: [...objetos.values()], entidades: [...entidades, ...entidadesBanco], bloqueiosExecucao, gravacoesRemotas: 0 };
}
