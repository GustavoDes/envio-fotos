const fs = require("fs");
const { google } = require("googleapis");

const TOKEN_PATH = "token.json";
const CREDENTIALS_PATH = "oauth-client.json";

async function getAuthenticatedClient() {

    const credentials = JSON.parse(
        fs.readFileSync(CREDENTIALS_PATH)
    );

    const {
        client_secret,
        client_id,
        redirect_uris
    } = credentials.web;

    const oAuth2Client =
        new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        );

    if (fs.existsSync(TOKEN_PATH)) {

        const token = JSON.parse(
            fs.readFileSync(TOKEN_PATH)
        );

        oAuth2Client.setCredentials(token);

        return oAuth2Client;
    }

    const authUrl =
        oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: [
                "https://www.googleapis.com/auth/drive"
            ]
        });

    console.log("\n");
    console.log("AUTORIZE ESTE APP:");
    console.log(authUrl);
    console.log("\n");

    throw new Error(
        "Primeira autenticação necessária."
    );
}

module.exports = {
    getAuthenticatedClient
};