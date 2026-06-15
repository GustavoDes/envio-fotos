const { google } = require("googleapis");

async function getAuthenticatedClient() {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive"]
    });

    return auth.getClient();
}

module.exports = { getAuthenticatedClient };