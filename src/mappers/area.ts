import type { Area, AreasAgregadas  } from "@/src/types/area";

export function aggregateAreas(areas: Area[], agenteId: number): AreasAgregadas {
  const areasDoAgente = areas.filter((area) =>
     area.agentes?.some((ag) => ag.user_id === agenteId)
  );
  return {
    total:  areasDoAgente.length,
    ativas: areasDoAgente.filter((a) => a.ativo).length,
    lista:  areasDoAgente,
  };
}

export function calcularProgressoArea(area: Area): number {
  const quadras = area.quadras ?? [];
  if (quadras.length === 0) return 0;
  const concluidas = quadras.filter((q) => q.status === "concluida").length;
  return Math.round((concluidas / quadras.length) * 100);
}

export function calcularStatusArea(area: Area): "ativo" | "pendente" | "concluido" {
  const progresso = calcularProgressoArea(area);
  if (progresso === 100) return "concluido";
  if (progresso === 0)   return "pendente";
  return "ativo";
}