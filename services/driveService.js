const { google } = require("googleapis");
const fs = require("fs");

const ROOT_FOLDER_ID = "11I2WVVxHharF47X2i-tKOFI6sfeYdVD2";

const { getAuthenticatedClient } = require("./auth");

// Cache por uploadId — evita race condition no upload paralelo.
// Armazena a Promise, não o resultado, para que requisições simultâneas
// aguardem a mesma operação em vez de criar pastas duplicadas.
const pastaCache = new Map();

async function getDrive() {
    const authClient = await getAuthenticatedClient();
    return google.drive({ version: "v3", auth: authClient });
}

async function buscarSubpasta(drive, parentId, nomePasta) {
    const resultado = await drive.files.list({
        q: `'${parentId}' in parents and name='${nomePasta}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id,name)"
    });
    return resultado.data.files[0] || null;
}

async function buscarOuCriarSubpasta(drive, parentId, nomePasta) {
    const existente = await buscarSubpasta(drive, parentId, nomePasta);
    if (existente) return existente;

    const nova = await drive.files.create({
        requestBody: {
            name: nomePasta,
            mimeType: "application/vnd.google-apps.folder",
            parents: [parentId]
        },
        fields: "id,name"
    });
    return nova.data;
}

// Converte "yyyy-mm-dd" para "dd/mm/yyyy"
function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
}

async function _resolverPastaAtividade({ ramo, subunidade, tipo, data, atividade }) {
    const drive = await getDrive();

    // 1. Pasta do ramo (deve existir no Drive)
    let pastaAtual = await buscarSubpasta(drive, ROOT_FOLDER_ID, ramo);
    if (!pastaAtual) throw new Error(`Ramo não encontrado: ${ramo}`);

    // 2. Pasta da subunidade, se houver (deve existir no Drive)
    if (subunidade && subunidade.trim() !== "") {
        const pastaSub = await buscarSubpasta(drive, pastaAtual.id, subunidade);
        if (!pastaSub) throw new Error(`Subunidade não encontrada: ${subunidade}`);
        pastaAtual = pastaSub;
    }

    // 3. Pasta "Sede" ou "Externa" — criada automaticamente se não existir
    pastaAtual = await buscarOuCriarSubpasta(drive, pastaAtual.id, tipo);

    // 4. Pasta da atividade: "Nome da Atividade - dd/mm/yyyy"
    const nomePastaAtividade = `${atividade} - ${formatarData(data)}`;
    pastaAtual = await buscarOuCriarSubpasta(drive, pastaAtual.id, nomePastaAtividade);

    return pastaAtual;
}

/**
 * Busca ou cria a pasta da atividade usando uploadId como chave de cache.
 * Todas as requisições do mesmo upload compartilham a mesma Promise,
 * garantindo que a pasta seja criada apenas uma vez mesmo com uploads paralelos.
 */
async function buscarOuCriarPastaAtividadePorUploadId({ uploadId, ramo, subunidade, tipo, data, atividade }) {
    if (!uploadId) {
        return _resolverPastaAtividade({ ramo, subunidade, tipo, data, atividade });
    }

    if (!pastaCache.has(uploadId)) {
        const promessa = _resolverPastaAtividade({ ramo, subunidade, tipo, data, atividade })
            .catch((err) => {
                pastaCache.delete(uploadId); // permite nova tentativa em caso de erro
                throw err;
            });

        pastaCache.set(uploadId, promessa);

        // Limpa o cache após 30 minutos para não vazar memória
        setTimeout(() => pastaCache.delete(uploadId), 30 * 60 * 1000);
    }

    return pastaCache.get(uploadId);
}

async function enviarArquivo(pastaId, caminhoArquivo, nomeArquivo) {
    const drive = await getDrive();

    const resposta = await drive.files.create({
        requestBody: {
            name: nomeArquivo,
            parents: [pastaId]
        },
        media: {
            body: fs.createReadStream(caminhoArquivo)
        },
        fields: "id,name"
    });

    return resposta.data;
}

module.exports = {
    buscarOuCriarPastaAtividadePorUploadId,
    enviarArquivo
};