const fs = require('fs');
const path = require('path');

module.exports = function(req, res) {
    // 1. Recebe a senha digitada no site
    const senha = req.query.senha;

    // 2. Confere a senha (Mude aqui se quiser)
    if (senha !== "multitec2026") {
        return res.status(401).json({ erro: "Acesso negado." });
    }

    try {
        // 3. Lê o arquivo secreto lá da raiz do projeto
        const caminhoArquivo = path.join(process.cwd(), 'atacado.csv');
        const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');

        // 4. Converte o CSV e devolve para o site
        const linhas = conteudo.split('\n');
        const precosAtacado = {};

        for (let i = 1; i < linhas.length; i++) {
            const colunas = linhas[i].split(';'); 
            if (colunas.length >= 2) {
                const codigo = colunas[0].trim();
                const preco = colunas[1].trim();
                precosAtacado[codigo] = preco;
            }
        }

        res.status(200).json(precosAtacado);
    } catch (erro) {
        res.status(500).json({ erro: "Arquivo atacado.csv não encontrado no servidor." });
    }
};