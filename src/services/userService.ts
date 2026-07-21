import { api } from "@/src/services/api";

export interface AtualizarSenhaPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export const userService = {
  async atualizarSenha(payload: AtualizarSenhaPayload): Promise<void> {
    await api.put("/user/senha", payload);
  },
};
