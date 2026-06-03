const { google } = require("googleapis");
const fs = require("fs");

const ROOT_FOLDER_ID = "11I2WVVxHharF47X2i-tKOFI6sfeYdVD2";

const { getAuthenticatedClient } =
    require("./auth");

async function getDrive() {

    const authClient =
        await getAuthenticatedClient();

    return google.drive({
        version: "v3",
        auth: authClient
    });

}

async function buscarSubpasta(drive, parentId, nomePasta) {
    const resultado = await drive.files.list({
        q: `'${parentId}' in parents and name='${nomePasta}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id,name)"
    });

    return resultado.data.files[0] || null;
}

async function criarPasta(drive, nome, parentId) {
    const pasta = await drive.files.create({
        requestBody: {
            name: nome,
            mimeType: "application/vnd.google-apps.folder",
            parents: [parentId]
        },
        fields: "id,name"
    });

    return pasta.data;
}

async function buscarOuCriarPastaAtividade({
    ramo,
    subunidade,
    tipo,
    data,
    atividade
}) {
    const drive = await getDrive();

    let pastaBase = await buscarSubpasta(
        drive,
        ROOT_FOLDER_ID,
        ramo
    );

    if (!pastaBase) {
        throw new Error(`Ramo não encontrado: ${ramo}`);
    }

    if (subunidade && subunidade.trim() !== "") {
        const pastaSub = await buscarSubpasta(
            drive,
            pastaBase.id,
            subunidade
        );

        if (!pastaSub) {
            throw new Error(
                `Subunidade não encontrada: ${subunidade}`
            );
        }

        pastaBase = pastaSub;
    }

    const nomePastaAtividade =
        `${data} - ${tipo} - ${atividade}`;

    let pastaAtividade =
        await buscarSubpasta(
            drive,
            pastaBase.id,
            nomePastaAtividade
        );

    if (!pastaAtividade) {
        pastaAtividade = await criarPasta(
            drive,
            nomePastaAtividade,
            pastaBase.id
        );
    }

    return pastaAtividade;
}

async function enviarArquivo(
    pastaId,
    caminhoArquivo,
    nomeArquivo
) {
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
    buscarOuCriarPastaAtividade,
    enviarArquivo
};