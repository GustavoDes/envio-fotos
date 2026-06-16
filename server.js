const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");
const { criarCliente } = require("./auth");

const uploadRoutes = require("./routes/upload");

const app = express();

app.use(cors({
    origin: [
        "https://envio-fotos-gearpe.netlify.app",
        "http://localhost:5500"
    ]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", uploadRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota de callback OAuth — usada apenas uma vez para gerar o token
app.get("/oauth2callback", async (req, res) => {
    try {
        const oAuth2Client = criarCliente();
        const code = req.query.code;
        const { tokens } = await oAuth2Client.getToken(code);

        res.send(`
            <h2>Autenticação concluída!</h2>
            <p>Copie o valor abaixo e salve como variável de ambiente <strong>GOOGLE_TOKEN</strong> no Render:</p>
            <textarea rows="10" cols="80" onclick="this.select()">${JSON.stringify(tokens)}</textarea>
            <p>Depois faça um novo deploy no Render.</p>
        `);
    } catch (erro) {
        console.error(erro);
        res.status(500).send(erro.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});