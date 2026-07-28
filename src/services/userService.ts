import { api } from "@/src/services/api";

export interface AtualizarSenhaPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface UsuarioAtualizado {
  id: number;
  name: string;
  email: string;
  foto_perfil_url?: string | null;
  [key: string]: unknown;
}

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

export const userService = {
  async atualizarSenha(payload: AtualizarSenhaPayload): Promise<void> {
    await api.put("/user/senha", payload);
  },

  /** Envia a nova foto de perfil (mesma rota que o admin web usa). */
  async atualizarFoto(arquivo: { uri: string; name: string; type: string }): Promise<UsuarioAtualizado> {
    const formData = new FormData();
    formData.append("foto", arquivo as unknown as Blob);

    const res = await api.post("/user/foto", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<UsuarioAtualizado>(res);
  },

  async removerFoto(): Promise<UsuarioAtualizado> {
    const res = await api.delete("/user/foto");
    return unwrap<UsuarioAtualizado>(res);
  },
};
