const urlPlanilha = "estoque.csv";
const arquivoAtacado = "atacado_x7f9.csv";

const containerProdutos = document.querySelector('.products-container');
const campoBusca = document.querySelector('.search-input');
const containerCategorias = document.getElementById('box-categorias');
const toggleAtacado = document.getElementById('toggle-atacado');

let produtosMultitec = []; 
let categoriaAtual = 'Todos'; 

const SENHA_ATACADO = "multitec2026";
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
        
        if (modoAtacadoAtivo && precosAtacado[produto.codigo]) {
            precoDisplay = precosAtacado[produto.codigo] + " (Atacado)";
        }
        
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

        card.innerHTML = `
            <span class="product-tag">${produto.tag || 'Geral'} (Cód: ${produto.codigo || '-'})</span>
            <h3 class="product-title">${produto.nome}</h3>
            <div class="product-price">${precoDisplay}</div>
            <div class="product-stock" style="${estiloEstoque} font-size: 0.9rem; font-weight: bold; margin-top: 8px;">${textoEstoque}</div>
        `;
        containerProdutos.appendChild(card);
    });
}

campoBusca.addEventListener('input', aplicarFiltros);

toggleAtacado.addEventListener('change', (evento) => {
    if (evento.target.checked) {
        const palpite = prompt("Área Restrita para Lojistas. Digite a senha de acesso:");
        
        // Bate na porta do servidor Vercel enviando a senha
        fetch(`/api/atacado?senha=${palpite}`)
            .then(resposta => {
                if (!resposta.ok) throw new Error("Senha incorreta");
                return resposta.json();
            })
            .then(dados => {
                alert("Acesso liberado! Carregando tabela de preços de atacado...");
                precosAtacado = dados;
                modoAtacadoAtivo = true;
                aplicarFiltros();
            })
            .catch(() => {
                alert("Senha incorreta ou arquivo de atacado inexistente.");
                evento.target.checked = false;
                modoAtacadoAtivo = false;
            });
    } else {
        modoAtacadoAtivo = false;
        aplicarFiltros(); 
    }
});