"use client";

type EntradaCache = {
  carregamento: Promise<unknown>;
  pronta: boolean;
  valor?: unknown;
};

const cacheAdministrativo = new Map<string, EntradaCache>();

export function obterDadosCacheados<T>(
  chave: string,
  carregar: () => Promise<T>,
): Promise<T> {
  const entradaExistente = cacheAdministrativo.get(chave);
  if (entradaExistente) return entradaExistente.carregamento as Promise<T>;

  const entrada: EntradaCache = { carregamento: Promise.resolve(undefined), pronta: false };
  entrada.carregamento = Promise.resolve()
    .then(carregar)
    .then((valor: T) => {
      if (cacheAdministrativo.get(chave) === entrada) {
        entrada.valor = valor;
        entrada.pronta = true;
      }
      return valor;
    })
    .catch((erro: unknown) => {
      if (cacheAdministrativo.get(chave) === entrada) {
        cacheAdministrativo.delete(chave);
      }
      throw erro;
    });

  cacheAdministrativo.set(chave, entrada);
  return entrada.carregamento as Promise<T>;
}

export function lerDadosCacheados<T>(chave: string): T | undefined {
  const entrada = cacheAdministrativo.get(chave);
  return entrada?.pronta ? (entrada.valor as T) : undefined;
}

export function invalidarDadosCacheados(chave: string): void {
  cacheAdministrativo.delete(chave);
}

export function limparCacheAdministrativo(): void {
  cacheAdministrativo.clear();
}

export async function buscarJsonAdministrativo<T>(endereco: string): Promise<T> {
  const resposta = await fetch(endereco, { credentials: "include" });
  if (!resposta.ok) {
    throw new Error(`Falha ao carregar dados administrativos (${resposta.status}).`);
  }
  return (await resposta.json()) as T;
}
