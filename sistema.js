// Coloque aqui o link do seu Google Sheets publicado em CSV ou deixe estoque.csv se for local
const urlPlanilha = "estoque.csv"; 

const containerProdutos = document.querySelector('.products-container');
const campoBusca = document.querySelector('.search-input');
const containerCategorias = document.getElementById('box-categorias');

let produtosMultitec = []; 
let categoriaAtual = 'Todos'; 

// Variável para não travar o atacado enquanto não mexemos nele
let modoAtacadoAtivo = false; 
let precosAtacado = {};

function removerAcentos(texto) {
    if (!texto) return "";
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function renderizarCategorias(lista) {
    const tags = lista.map(p => p.tag && p.tag.trim() !== "" ? p.tag.trim() : "Outros");
    const tagsUnicas = ["Todos", ...new Set(tags)].sort(); 

    containerCategorias.innerHTML = '';

    tagsUnicas.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${tag === categoriaAtual ? 'active' : ''}`;
        btn.textContent = tag;
        
        btn.addEventListener('click', () => {
            categoriaAtual = tag;
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            aplicarFiltros(); 
        });
        
        containerCategorias.appendChild(btn);
    });
}

function aplicarFiltros() {
    const textoBuscaLimpo = removerAcentos(campoBusca.value.toLowerCase());
    
    const produtosFiltrados = produtosMultitec.filter(produto => {
        if (!produto.nome) return false;
        
        const nomeProdutoLimpo = removerAcentos(produto.nome.toLowerCase());
        const codigoLimpo = produto.codigo ? produto.codigo.toLowerCase() : "";
        const tagProduto = produto.tag && produto.tag.trim() !== "" ? produto.tag.trim() : "Outros";

        const passaBusca = nomeProdutoLimpo.includes(textoBuscaLimpo) || codigoLimpo.includes(textoBuscaLimpo);
        const passaCategoria = categoriaAtual === 'Todos' || tagProduto === categoriaAtual;

        return passaBusca && passaCategoria;
    });
    
    renderizarProdutos(produtosFiltrados);
}

function renderizarProdutos(lista) {
    containerProdutos.innerHTML = '';
    const listaLimpa = lista.filter(p => p.nome && p.nome.trim() !== "");

    if (listaLimpa.length === 0) {
        containerProdutos.innerHTML = '<p style="color: white; text-align: center; width: 100%;">Nenhum produto encontrado.</p>';
        return;
    }

    listaLimpa.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        let precoDisplay = (produto.preco && produto.preco.trim() !== "") ? produto.preco : "Consultar Valor";
        
        const quantidadeEstoque = parseInt(produto.estoque) || 0;
        let estiloEstoque = "";
        let textoEstoque = "";

        if (quantidadeEstoque > 5) {
            textoEstoque = `${quantidadeEstoque} em estoque`;
            estiloEstoque = "color: #4CAF50;"; 
        } else if (quantidadeEstoque > 0) {
            textoEstoque = `Apenas ${quantidadeEstoque} em estoque!`;
            estiloEstoque = "color: #FFC107;"; 
        } else {
            textoEstoque = "Esgotado / Sob encomenda";
            estiloEstoque = "color: #D31212;"; 
        }

        // =========================================
        // LÓGICA DA FOTO DIRETA / AGUARDE
        // =========================================
        let imagemHtml = '';
        
        // Se tem algo escrito na coluna 'imagem' no Google Sheets...
        if (produto.imagem && produto.imagem.trim() !== "") {
            imagemHtml = `<img src="${produto.imagem}" alt="${produto.nome}" class="product-image" onerror="this.src='logo-multitec.png'">`;
        } else {
            // Se a célula estiver vazia...
            imagemHtml = `
                <div class="aguarde-placeholder">
                    <span class="aguarde-texto">📸<br>Aguarde...<br>Foto em breve</span>
                </div>
            `;
        }

        card.innerHTML = `
            ${imagemHtml}
            <span class="product-tag">${produto.tag || 'Geral'} (Cód: ${produto.codigo || '-'})</span>
            <h3 class="product-title">${produto.nome}</h3>
            <div class="product-price">${precoDisplay}</div>
            <div class="product-stock" style="${estiloEstoque} font-size: 0.9rem; font-weight: bold; margin-top: 8px;">${textoEstoque}</div>
        `;
        containerProdutos.appendChild(card);
    });
}

campoBusca.addEventListener('input', aplicarFiltros);

// Dá a partida e lê a sua planilha CSV
Papa.parse(urlPlanilha, {
    download: true,
    header: true,
    delimiter: "", // Identifica automaticamente vírgula ou ponto-e-vírgula do Google Sheets
    complete: function(resultados) {
        produtosMultitec = resultados.data;
        renderizarCategorias(produtosMultitec);
        renderizarProdutos(produtosMultitec);
    },
    error: function() {
        containerProdutos.innerHTML = '<p style="color: #D31212; text-align: center; width: 100%;"><b>Erro:</b> Planilha não encontrada.</p>';
    }
});