import { createHash } from 'node:crypto';

const sha256 = (valor) => createHash('sha256').update(valor).digest('hex');

function canonico(valor) {
  if (Buffer.isBuffer(valor) || (ArrayBuffer.isView(valor) && !(valor instanceof DataView))) {
    const bytes = Buffer.from(valor.buffer, valor.byteOffset, valor.byteLength);
    return { __bytesSha256: sha256(bytes), bytes: bytes.length };
  }
  if (valor instanceof Date) return valor.toISOString();
  if (Array.isArray(valor)) return valor.map(canonico);
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.keys(valor).sort().map((chave) => [chave, canonico(valor[chave])]));
  return valor;
}

export function hashRegistro(valor) {
  return sha256(JSON.stringify(canonico(valor)));
}

const CAMPOS_TIMESTAMP_COM_FUSO = {
  Agenda: ['data', 'createdAt'],
};
const CAMPOS_TIMESTAMP_SEM_FUSO = {
  Noticia: ['createdAt'],
  Livro: ['createdAt'],
  Projeto: ['data'],
};

function normalizarTimestampComFuso(valor, campo) {
  if (valor == null) return null;
  if (typeof valor !== 'string') throw new Error(`Timestamp com fuso inválido em ${campo}`);
  const partes = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|([+-])(\d{2})(?::?(\d{2}))?)$/i.exec(valor);
  if (!partes) throw new Error(`Timestamp com fuso não interpretável em ${campo}`);
  const [, data, hora, fracao = '', zona, sinal, horas = '00', minutos = '00'] = partes;
  const [ano, mes, dia] = data.split('-').map(Number);
  const [horaDia, minuto, segundo] = hora.split(':').map(Number);
  const millisBase = Date.UTC(ano, mes - 1, dia, horaDia, minuto, segundo);
  if (!Number.isFinite(millisBase)) throw new Error(`Timestamp fora do intervalo em ${campo}`);
  const microsFracao = BigInt(fracao.padEnd(6, '0') || '0');
  const deslocamentoMinutos = zona.toUpperCase() === 'Z' ? 0 : Number(horas) * 60 + Number(minutos);
  if (Number(horas) > 15 || Number(minutos) > 59) throw new Error(`Fuso horário inválido em ${campo}`);
  const direcao = sinal === '+' ? 1n : sinal === '-' ? -1n : 0n;
  const microsComFuso = BigInt(millisBase) * 1000n + microsFracao - direcao * BigInt(deslocamentoMinutos) * 60_000_000n;
  return { __tipo: 'timestamp-com-fuso', microsDesdeUnixEpoch: microsComFuso.toString() };
}

function normalizarTimestampSemFuso(valor, campo) {
  if (valor == null) return null;
  if (typeof valor !== 'string') throw new Error(`Timestamp sem fuso inválido em ${campo}`);
  const partes = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?$/.exec(valor);
  if (!partes) throw new Error(`Timestamp sem fuso não interpretável em ${campo}`);
  const [, data, hora, fracao = ''] = partes;
  return { __tipo: 'timestamp-sem-fuso', valor: `${data}T${hora}.${fracao.padEnd(6, '0')}` };
}

/** Hash comparável entre o snapshot SQL (timestamps em texto) e a leitura futura do destino. */
export function hashRegistroLegado(tabela, chaveOrigem, dados) {
  const campos = { ...dados };
  for (const campo of CAMPOS_TIMESTAMP_COM_FUSO[tabela] ?? []) campos[campo] = normalizarTimestampComFuso(campos[campo], `${tabela}.${campo}`);
  for (const campo of CAMPOS_TIMESTAMP_SEM_FUSO[tabela] ?? []) campos[campo] = normalizarTimestampSemFuso(campos[campo], `${tabela}.${campo}`);
  return hashRegistro({ tabela, chaveOrigem, dados: campos });
}
