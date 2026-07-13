import { QuadrasAgregadas } from "@/src/types/quadra";
import { Area } from "@/src/types/area";


export function aggregateQuadras(areas: Area[]): QuadrasAgregadas {
  return areas.reduce<QuadrasAgregadas>(
    (acc, area) => {
      const quadras = area.quadras ?? [];
      return {
        total:         acc.total         + quadras.length,
        nao_iniciadas: acc.nao_iniciadas + quadras.filter((q) => q.status === "nao_iniciada").length,
        em_andamento:  acc.em_andamento  + quadras.filter((q) => q.status === "em_andamento").length,
        concluidas:    acc.concluidas    + quadras.filter((q) => q.status === "concluida").length,
      };
    },
    { total: 0, nao_iniciadas: 0, em_andamento: 0, concluidas: 0 }
  );
}