const { google } = require("googleapis");

async function getAuthenticatedClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: ["https://www.googleapis.com/auth/drive"]
    });

    return auth.getClient();
}

module.exports = { getAuthenticatedClient };