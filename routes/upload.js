const express = require("express");
const multer = require("multer");
const fs = require("fs");

const {
    buscarOuCriarPastaAtividadePorUploadId,
    enviarArquivo
} = require("../services/driveService");

const router = express.Router();

const SENHA = "gearpe123";

const upload = multer({ dest: "uploads/" });

router.get("/status", (req, res) => {
    res.json({ ok: true, mensagem: "API funcionando" });
});

router.post(
    "/upload",
    upload.array("fotos", 500),
    async (req, res) => {
        try {
            const {
                senha,
                ramo,
                subunidade,
                tipo,
                data,
                atividade,
                uploadId          // recebido do frontend
            } = req.body;

            if (senha !== SENHA) {
                return res.status(401).json({ ok: false, erro: "Senha inválida" });
            }
            if (!ramo)      return res.status(400).json({ ok: false, erro: "Ramo obrigatório" });
            if (!tipo)      return res.status(400).json({ ok: false, erro: "Tipo obrigatório" });
            if (!data)      return res.status(400).json({ ok: false, erro: "Data obrigatória" });
            if (!atividade) return res.status(400).json({ ok: false, erro: "Nome da atividade obrigatório" });

            // Busca ou cria a pasta UMA única vez por uploadId (mesmo com paralelo)
            const pastaAtividade = await buscarOuCriarPastaAtividadePorUploadId({
                uploadId,
                ramo,
                subunidade,
                tipo,
                data,
                atividade
            });

            const enviados = await Promise.all(
                req.files.map(async (arquivo) => {
                    try {
                        const resultado = await enviarArquivo(
                            pastaAtividade.id,
                            arquivo.path,
                            arquivo.originalname
                        );
                        return resultado;
                    } finally {
                        // Remove o arquivo temporário mesmo se o envio falhar
                        try { fs.unlinkSync(arquivo.path); } catch (_) {}
                    }
                })
            );

            res.json({
                ok: true,
                pasta: pastaAtividade,
                arquivosEnviados: enviados.length,
                arquivos: enviados
            });

        } catch (erro) {
            console.error(erro);
            res.status(500).json({ ok: false, erro: erro.message });
        }
    }
);

module.exports = router;