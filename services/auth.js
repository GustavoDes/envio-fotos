const { google } = require("googleapis");

function criarCliente() {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const { client_secret, client_id, redirect_uris } = credentials.web;
    return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

async function getAuthenticatedClient() {
    const oAuth2Client = criarCliente();

    if (!process.env.GOOGLE_TOKEN) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/drive"],
            prompt: "consent" // garante que sempre retorna refresh_token
        });
        console.log("\n=== AUTORIZAÇÃO NECESSÁRIA ===");
        console.log("Acesse esta URL para autorizar o app:");
        console.log(authUrl);
        console.log("==============================\n");
        throw new Error("GOOGLE_TOKEN não definido. Veja os logs para autorizar.");
    }

    const token = JSON.parse(process.env.GOOGLE_TOKEN);
    oAuth2Client.setCredentials(token);

    // Atualiza o token automaticamente quando expirar
    oAuth2Client.on("tokens", (novosTokens) => {
        const tokenAtual = JSON.parse(process.env.GOOGLE_TOKEN);
        const tokenAtualizado = { ...tokenAtual, ...novosTokens };
        console.log("=== TOKEN ATUALIZADO ===");
        console.log("Atualize a variável GOOGLE_TOKEN no Render com:");
        console.log(JSON.stringify(tokenAtualizado));
        console.log("=======================");
    });

    return oAuth2Client;
}

module.exports = { getAuthenticatedClient, criarCliente };