import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agenteService } from '../services/agenteService';

export function useAgentes() {
  return useQuery({
    queryKey: ['agentes'],
    queryFn: agenteService.listar,
  });
}

export function useDeleteAgente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: agenteService.deletar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
    },
  });
}