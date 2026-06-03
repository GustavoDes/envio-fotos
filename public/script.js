const SENHA_SISTEMA = "gearpe123";

const uploadOverlay   = document.getElementById("uploadOverlay");
const successOverlay  = document.getElementById("successOverlay");
const loginScreen     = document.getElementById("loginScreen");
const uploadScreen    = document.getElementById("uploadScreen");
const progressFill    = document.getElementById("progressFill");
const progressLabel   = document.getElementById("progressLabel");

uploadOverlay.style.display  = "none";
successOverlay.style.display = "none";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
document.getElementById("btnEntrar").addEventListener("click", () => {

    const senha = document.getElementById("senhaLogin").value;
    const erro  = document.getElementById("loginErro");

    if (senha === SENHA_SISTEMA) {
        document.getElementById("senhaOculta").value = senha;
        loginScreen.style.display  = "none";
        uploadScreen.style.display = "block";
    } else {
        erro.innerHTML = "Senha incorreta. Tente novamente.";
    }
});

// ---------------------------------------------------------------------------
// Subunidades
// ---------------------------------------------------------------------------
const estrutura = {
    "Ramo Lobinho":   ["Alcatéia Seeonee", "Alcatéia Abangani"],
    "Ramo Escoteiro": ["Tropa 14 bis", "Tropa Senta a Pua", "Tropa Sputnik"],
    "Ramo Sênior":    [],
    "Ramo Pioneiro":  [],
    "Chefia":         [],
    "Geral-Misto":    []
};

const ramoSelect       = document.getElementById("ramo");
const subunidadeSelect = document.getElementById("subunidade");
const subContainer     = document.getElementById("subunidadeContainer");

ramoSelect.addEventListener("change", atualizarSubunidades);

function atualizarSubunidades() {
    const lista = estrutura[ramoSelect.value] || [];
    subunidadeSelect.innerHTML = "";

    if (lista.length === 0) {
        subContainer.style.display = "none";
        return;
    }

    subContainer.style.display = "block";
    lista.forEach(item => {
        const opt = document.createElement("option");
        opt.value = opt.textContent = item;
        subunidadeSelect.appendChild(opt);
    });
}

atualizarSubunidades();

// ---------------------------------------------------------------------------
// Upload em paralelo com progresso
// ---------------------------------------------------------------------------
const CONCORRENCIA = 3; // quantos uploads simultâneos

document.getElementById("uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const resultado = document.getElementById("resultado");
    resultado.innerHTML = "";

    progressFill.style.width  = "0%";
    progressLabel.textContent = "0%";
    uploadOverlay.style.display = "flex";

    const form     = document.getElementById("uploadForm");
    const arquivos = Array.from(document.getElementById("fotos").files);

    // Rastreia bytes enviados por arquivo
    const bytesEnviados = new Array(arquivos.length).fill(0);
    const bytesTotal    = arquivos.reduce((acc, f) => acc + f.size, 0);

    function atualizarProgresso(index, bytes) {
        bytesEnviados[index] = bytes;
        const enviado = bytesEnviados.reduce((a, b) => a + b, 0);
        const pct = Math.round(enviado / bytesTotal * 100);
        progressFill.style.width  = pct + "%";
        progressLabel.textContent = pct + "%";
    }

    function enviarArquivo(arquivo, index) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();

            // Copia os campos do formulário (ramo, data, etc.)
            for (const [key, value] of new FormData(form).entries()) {
                if (key !== "fotos") formData.append(key, value);
            }
            formData.append("fotos", arquivo);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/upload");

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) atualizarProgresso(index, e.loaded);
            };

            xhr.onload = () => {
                atualizarProgresso(index, arquivo.size);
                try {
                    const json = JSON.parse(xhr.responseText);
                    json.ok ? resolve() : reject(new Error(json.erro));
                } catch {
                    reject(new Error("Resposta inválida do servidor."));
                }
            };

            xhr.onerror = () => reject(new Error("Falha de rede."));
            xhr.send(formData);
        });
    }

    // Executa em paralelo respeitando o limite de concorrência
    async function executarEmLotes(arquivos) {
        const erros = [];
        let i = 0;

        async function proximoTrabalho() {
            while (i < arquivos.length) {
                const index = i++;
                try {
                    await enviarArquivo(arquivos[index], index);
                } catch (err) {
                    erros.push(`${arquivos[index].name}: ${err.message}`);
                }
            }
        }

        const workers = Array.from({ length: CONCORRENCIA }, proximoTrabalho);
        await Promise.all(workers);
        return erros;
    }

    try {
        const erros = await executarEmLotes(arquivos);
        uploadOverlay.style.display = "none";

        if (erros.length === 0) {
            successOverlay.style.display = "flex";
            resultado.innerHTML = `<div class="sucesso">Upload concluído.</div>`;
        } else {
            resultado.innerHTML = `<div class="erro">${erros.join("<br>")}</div>`;
        }
    } catch {
        uploadOverlay.style.display = "none";
        resultado.innerHTML = `<div class="erro">Falha no upload.</div>`;
    }
});

// ---------------------------------------------------------------------------
// Contador de fotos
// ---------------------------------------------------------------------------
document.getElementById("fotos").addEventListener("change", (e) => {
    const arquivos = e.target.files;
    let tamanhoTotal = 0;
    for (const f of arquivos) tamanhoTotal += f.size;
    const tamanhoMB = (tamanhoTotal / 1024 / 1024).toFixed(1);
    document.getElementById("contadorFotos").innerHTML =
        `${arquivos.length} foto(s) • ${tamanhoMB} MB`;
});

// ---------------------------------------------------------------------------
// Fechar overlay de sucesso
// ---------------------------------------------------------------------------
document.getElementById("btnFecharSucesso").addEventListener("click", () => {
    successOverlay.style.display = "none";
    document.getElementById("uploadForm").reset();
    document.getElementById("contadorFotos").innerHTML = "";
    progressFill.style.width  = "0%";
    progressLabel.textContent = "0%";
});