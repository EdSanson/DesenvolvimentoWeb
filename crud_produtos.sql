CREATE DATABASE crud_produtos;

USE crud_produtos;

CREATE TABLE produtos(
	id INT AUTO_INCREMENT PRIMARY KEY,
	nome VARCHAR(100) NOT NULL,
    quantidade INT  NOT NULL,
	preco DECIMAL(02) NOT NULL
	);

DESCRIBE produtos;

INSERT INTO produtos (nome, quantidade, preco) VALUES
('Bolsa', 10, 30.00),
('Monitor', 5, 50.00);

SELECT * FROM produtos;
