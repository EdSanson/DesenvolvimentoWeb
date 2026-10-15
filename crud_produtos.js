const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'crud_produtos'
});


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}));


app.get("/cadastrar",function(req,res){
    res.sendFile(__dirname+"/crud_produtos.html")

});

app.listen(8083, function(){
    console.log
    ("Servidor rodando na url http://localhost:8083");
});
app.get("/",function(req,res){
    res.sendFile(__dirname+"/pg_inicialProdutos.html")
});



app.post("/cadastrar", function(req, res){
    const nome = req.body.nome;
    const preco = req.body.preco;
    const quantidade = req.body.quantidade;

    const values = [nome, quantidade, preco];
    const insert = 
        "INSERT INTO produtos (nome, quantidade, preco) VALUES(?, ?, ?)";

    connection.query(insert, values, function(err,result){
        if (err){
            console.error("Dados não inseridos", err);
            res.send("Erro");
        } else {
            console.log("Dados inseridos com sucesso!");
            res.redirect("/listar");
        }
    });
});


app.get("/listar", function(req, res){
    const selectAll = "SELECT * FROM produtos";

    connection.query(selectAll, function(err, rows){
            if(!err){
                res.send(`<html>
                    <head>
                        <title> Lista de produtos </title>
                    </head>
                    <body>
                        <h1> Lista de produtos</h1>
                        <table>
                        <tr>
                            <th>Nome</th>
                            <th>Quantidade</th>
                            <th>Preço</th>
                        </tr>
                        ${rows.map(row=>`
                        <tr>
                            <td>${row.nome}</td>
                            <td>${row.quantidade}</td>
                            <td>${row.preco}</td>
                            <td><a href="/deletar/${row.id}">Deletar</a></td>
                            <td><a href="/atualizar-form/${row.id}">Alterar</a></td>

                            </tr>`).join('')}
                    </table>
                    <br><br>
                         <a href="/">Cadastrar novo produto</a>
                    </body>

                </html>`);
            }else{
                console.error("Erro ao listar os produtos", err);
                res.status(500).send("Erro ao listar os dados")
            }
        });
});

app.get("/deletar/:id", function(req,res){
    const idDoProduto = req.params.id;
    const deleteProduto = "DELETE FROM produtos WHERE id=?"

    connection.query(deleteProduto,[idDoProduto],(err,rows) =>{
        if(!err){
          console.log("Produto excluído com sucesso!");
          res.redirect("/listar");
        }else{
            console.error("Erro ao excluir produto",err);
            res.status(500).send("Erro ao excluir produto!");
        }
   });
});

app.post("/atualizar/:id", (req,res) => {

    const update = "UPDATE produtos SET nome = ?, preco = ?, quantidade=? WHERE id =?";
    const nome = req.body.nome;
    const preco = req.body.preco;
    const quantidade = req.body.quantidade;
    const id = req.params.id;
    
    connection.query(update, [nome, preco, quantidade, id], 
        function(err, result){
            if(!err){
                console.log("Dados Atualizados com Sucesso!");
                res.send("Dados Atualizados");
            } else {
                console.log("Erro ao atualizar ", err);
                res.status(500).send("Erro ao atualizar!");
            }
        });
});

app.get("/atualizar-form/:id", function(req,res){
    const id = req.params.id;
    const selectProduto= ("SELECT * FROM produtos WHERE id=?")

    connection.query(selectProduto, [id], function(err, result){
        if(!err && result.length >0){
            const produto = result[0];

            res.send(`
                <!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atualizar Cadastro de Produtos</title>
</head>
<body>
    <h1>Atualizar Cadastro de Produtos</h1>

    <form action="/atualizar/${id}" method="POST">
        <label for="nome"> Nome do Produto</label> <br>
        <input type="text" id="nome" name="nome" required value=${produto.nome}> <br>
        <br>
         <label for="quantidade"> Quantidade</label> <br>
        <input type="number" id="quantidade" name="quantidade" required value=${produto.quantidade}> <br>
        <br>
         <label for="preco"> Preço</label> <br>
        <input type="number" id="preco" name="preco" required value=${produto.preco}> <br><br>
        <input type="submit">
        <br><br>
        <a href="/listar">Listar produtos</a>

    </form>
</body>
</html>`)
        } else {
            console.log("Erro ao obter dados do produto", err);
            res.status(500).send("Erro ao obter dados do produto")
        }
    })
})

