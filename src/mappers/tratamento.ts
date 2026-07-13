import { Tratamento } from "@/src/types/tratamento";

export function getTratamentoStatusValue(tratamento: Tratamento): string {
    return typeof tratamento.status === "object"
        ? tratamento.status.value
        : tratamento.status;
}

export function findTratamentoAtivo(tratamentos: Tratamento[]): Tratamento | null {
    return tratamentos.find(
        (t) => getTratamentoStatusValue(t) === "em_andamento"
    ) ?? null;
}