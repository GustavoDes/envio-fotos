const { google } = require("googleapis");

async function getAuthenticatedClient() {
    if (!process.env.GOOGLE_CREDENTIALS) {
        throw new Error("Variável de ambiente GOOGLE_CREDENTIALS não definida.");
    }

    let credentials;
    try {
        credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } catch (e) {
        throw new Error("GOOGLE_CREDENTIALS não é um JSON válido: " + e.message);
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive"]
    });

    return auth.getClient();
}

module.exports = { getAuthenticatedClient };