import { api } from './api';

export interface Agente {
  id: string;
  nome: string;
  email: string;
}

export const agenteService = {
  async listar(): Promise<Agente[]> {
    const response = await api.get('/agentes');
    return response.data;
  },

  async deletar(id: string): Promise<void> {
    await api.delete(`/agentes/${id}`);
  },
};