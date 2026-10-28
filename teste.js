const mysql = require('mysql2/promise');
const express = require('express');

class Produto {
    constructor({ nome, quantidade, preco }) {
        this.nome = String(nome ?? '').trim();
        this.quantidade = Number(quantidade);
        this.preco = Number(preco);
    }

    validar() {
        if (!this.nome) {
            throw new Error('O nome do produto é obrigatório.');
        }

        if (!Number.isInteger(this.quantidade) || this.quantidade < 0) {
            throw new Error('A quantidade deve ser um número inteiro igual ou maior que zero.');
        }

        if (!Number.isFinite(this.preco) || this.preco < 0) {
            throw new Error('O preço deve ser um número igual ou maior que zero.');
        }
    }

    valoresParaBanco() {
        return [this.nome, this.quantidade, this.preco];
    }
}

class ProdutoController {
    constructor(db) {
        this.db = db;
    }

    async cadastrar(req, res) {
        try {
            const produto = new Produto(req.body);
            produto.validar();

            await this.db.execute(
                'INSERT INTO produtos (nome, quantidade, preco) VALUES (?, ?, ?)',
                produto.valoresParaBanco()
            );

            res.redirect('/listar');
        } catch (erro) {
            console.error('Erro ao cadastrar produto:', erro);
            res.status(400).send(erro.message || 'Erro ao cadastrar produto.');
        } finally {
            console.log('Tentativa de cadastro finalizada.');
        }
    }

    async listar(req, res) {
        try {
            const [produtos] = await this.db.execute(
                'SELECT id, nome, quantidade, preco FROM produtos'
            );

            const linhas = produtos.map(produto => `
                <tr>
                    <td>${escaparHTML(produto.nome)}</td>
                    <td>${produto.quantidade}</td>
                    <td>${produto.preco}</td>
                    <td><a href="/deletar/${produto.id}">Excluir</a></td>
                    <td><a href="/atualizar-form/${produto.id}">Atualizar</a></td>
                </tr>
            `).join('');

            res.send(`
                <!doctype html>
                <html lang="pt-br">
                <head><meta charset="UTF-8"><title>Lista de produtos</title></head>
                <body>
                    <h1>Lista de produtos</h1>
                    <table>
                        <tr>
                            <th>Nome</th><th>Quantidade</th><th>Preço</th>
                            <th></th><th></th>
                        </tr>
                        ${linhas}
                    </table>
                    <br><a href="/">Voltar ao menu principal</a>
                </body>
                </html>
            `);
        } catch (erro) {
            console.error('Erro ao listar produtos:', erro);
            res.status(500).send('Erro ao listar os produtos.');
        } finally {
            console.log('Consulta de produtos finalizada.');
        }
    }

    async deletar(req, res) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                throw new Error('ID de produto inválido.');
            }

            await this.db.execute('DELETE FROM produtos WHERE id = ?', [id]);
            res.redirect('/listar');
        } catch (erro) {
            console.error('Erro ao excluir produto:', erro);
            res.status(400).send(erro.message || 'Erro ao excluir produto.');
        } finally {
            console.log('Tentativa de exclusão finalizada.');
        }
    }
}

function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[caractere]));
}

async function iniciarServidor() {
    let db;

    try {
        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'crud_produtos'
        });

        const app = express();
        const controller = new ProdutoController(db);

        app.use(express.urlencoded({ extended: false }));
        app.use(express.json());

        app.get('/', (req, res) => {
            res.sendFile(__dirname + '/pg_inicialProdutos.html');
        });

        app.get('/cadastrar', (req, res) => {
            res.sendFile(__dirname + '/crud_produtos.html');
        });

        app.post('/cadastrar', (req, res) =>
            controller.cadastrar(req, res)
        );

        app.get('/listar', (req, res) =>
            controller.listar(req, res)
        );

        app.get('/deletar/:id', (req, res) =>
            controller.deletar(req, res)
        );

        app.listen(8083, () => {
            console.log('Servidor rodando em http://localhost:8083');
        });
    } catch (erro) {
        console.error('Não foi possível iniciar a aplicação:', erro);
    } finally {
        // A conexão fica aberta enquanto o servidor está funcionando.
        // Feche-a no encerramento do processo, não após iniciar o servidor.
        process.on('SIGINT', async () => {
            try {
                if (db) await db.end();
            } finally {
                process.exit(0);
            }
        });
    }
}

iniciarServidor();