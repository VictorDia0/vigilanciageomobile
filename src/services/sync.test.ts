import { outbox } from "../db/outbox";
import { visitaService } from "./visitaService";
import { recuperacaoService } from "./recuperacaoService";
import { ocorrenciaService } from "./ocorrenciaService";
import { sincronizarPendentes } from "./sync";

jest.mock("../db/outbox", () => ({
  outbox: {
    pendentes: jest.fn(),
    remover: jest.fn(),
    registrarErro: jest.fn(),
  },
}));

jest.mock("./visitaService", () => ({
  visitaService: {
    fecharVisita: jest.fn(),
    encerrarQuadra: jest.fn(),
    criarImovel: jest.fn(),
    registrarImovel: jest.fn(),
    uploadFoto: jest.fn(),
  },
}));

jest.mock("./recuperacaoService", () => ({
  recuperacaoService: { registrar: jest.fn() },
}));

jest.mock("./ocorrenciaService", () => ({
  ocorrenciaService: { atender: jest.fn() },
}));

const jaFechadaError = {
  response: { status: 422, data: { message: "Esta visita já foi fechada e bloqueada." } },
};

describe("executarSincronizacao", () => {
  beforeEach(() => jest.clearAllMocks());

  it("remove o item fechar_visita quando o servidor diz que já está fechada", async () => {
    (outbox.pendentes as jest.Mock).mockReturnValue([
      { id: 1, client_uuid: "a", tipo: "fechar_visita", payload: { visita_id: 10 }, criado_em: "", tentativas: 0, ultimo_erro: null },
    ]);
    (visitaService.fecharVisita as jest.Mock).mockRejectedValue(jaFechadaError);

    const resultado = await sincronizarPendentes();

    expect(outbox.remover).toHaveBeenCalledWith(1);
    expect(outbox.registrarErro).not.toHaveBeenCalled();
    expect(resultado).toEqual({ enviados: 1, falhas: 0 });
  });

  it("continua e fecha a quadra mesmo se a visita já estava fechada", async () => {
    (outbox.pendentes as jest.Mock).mockReturnValue([
      {
        id: 2,
        client_uuid: "b",
        tipo: "encerrar_quadra",
        payload: { visita_id: 10, quadra_id: 99 },
        criado_em: "",
        tentativas: 0,
        ultimo_erro: null,
      },
    ]);
    (visitaService.fecharVisita as jest.Mock).mockRejectedValue(jaFechadaError);
    (visitaService.encerrarQuadra as jest.Mock).mockResolvedValue(undefined);

    const resultado = await sincronizarPendentes();

    expect(visitaService.encerrarQuadra).toHaveBeenCalledWith(99);
    expect(outbox.remover).toHaveBeenCalledWith(2);
    expect(resultado).toEqual({ enviados: 1, falhas: 0 });
  });

  it("continua registrando erro real (não idempotente) normalmente", async () => {
    (outbox.pendentes as jest.Mock).mockReturnValue([
      { id: 3, client_uuid: "c", tipo: "fechar_visita", payload: { visita_id: 11 }, criado_em: "", tentativas: 0, ultimo_erro: null },
    ]);
    const outroErro = { response: { status: 403, data: { message: "Sem permissão." } } };
    (visitaService.fecharVisita as jest.Mock).mockRejectedValue(outroErro);

    const resultado = await sincronizarPendentes();

    expect(outbox.remover).not.toHaveBeenCalled();
    expect(outbox.registrarErro).toHaveBeenCalledWith(3, "Sem permissão.");
    expect(resultado).toEqual({ enviados: 0, falhas: 1 });
  });
});
