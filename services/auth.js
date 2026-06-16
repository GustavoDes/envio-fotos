const { google } = require("googleapis");

function criarCliente() {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    return oAuth2Client;
}

async function getAuthenticatedClient() {
    const oAuth2Client = criarCliente();

    if (!process.env.GOOGLE_TOKEN) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/drive"],
            prompt: "consent"
        });
        console.log("\n=== AUTORIZAÇÃO NECESSÁRIA ===");
        console.log("Acesse esta URL para autorizar o app:");
        console.log(authUrl);
        console.log("==============================\n");
        throw new Error("GOOGLE_TOKEN não definido. Veja os logs para autorizar.");
    }

    const token = JSON.parse(process.env.GOOGLE_TOKEN);
    oAuth2Client.setCredentials(token);

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