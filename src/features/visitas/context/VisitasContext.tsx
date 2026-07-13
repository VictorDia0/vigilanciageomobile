import { createContext, useContext } from "react";
import { useVisitas } from "@/src/hooks/useVisitas";

type VisitasContextValue = ReturnType<typeof useVisitas> & {
  tratamentoId: number;
};

export const VisitasContext = createContext<VisitasContextValue | null>(null);

export function useVisitasContext(): VisitasContextValue {
  const ctx = useContext(VisitasContext);
  if (!ctx) throw new Error("useVisitasContext must be used inside VisitasContext.Provider");
  return ctx;
}