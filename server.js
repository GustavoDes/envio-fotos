const express = require("express");
const cors = require("cors");
const path = require("path");

const fs = require("fs");
const { google } = require("googleapis");

const uploadRoutes = require("./routes/upload");

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", uploadRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = 3000;

app.get(
    "/oauth2callback",
    async (req, res) => {

        try {

            const credentials =
                JSON.parse(
                    fs.readFileSync(
                        "oauth-client.json"
                    )
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

            const code =
                req.query.code;

            const { tokens } =
                await oAuth2Client.getToken(
                    code
                );

            fs.writeFileSync(
                "token.json",
                JSON.stringify(
                    tokens,
                    null,
                    2
                )
            );

            res.send(
                "Autenticação concluída. Pode fechar esta janela."
            );

        } catch (erro) {

            console.error(erro);

            res.status(500).send(
                erro.message
            );
        }
    }
);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});


import cors from "cors";

app.use(cors({
  origin: [
    "https://envio-fotos-gearpe.netlify.app/",
    "http://localhost:5500"
  ]
}));