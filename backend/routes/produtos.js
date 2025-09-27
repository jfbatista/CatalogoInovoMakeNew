const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

/**
 * Configuração do roteador de produtos com rotas otimizadas
 * @param {Object} db - Instância do banco de dados MongoDB
 * @returns {Object} Router do Express configurado
 */
module.exports = function(db) {
  // Rota para obter produtos com filtros avançados e paginação
  router.get('/', async (req, res) => {
    try {
      const {
        depositoId,
        categoria,
        busca,
        ordenacao = 'nome_asc',
        pagina = 1,
        limite = 12,
        cursor,
        precoMin,
        precoMax,
        marcas
      } = req.query;
      
      // Construir o filtro base
      const filtro = {};
      const opcoes = {};
      
      // Aplicar filtro por depósito se fornecido
      if (depositoId) {
        // Buscar produtos de um depósito específico
        const produtosDeposito = await db.collection('DtoEstoqueDepositoProduto')
          .find({ DepositoID: depositoId })
          .toArray();
        
        if (produtosDeposito.length === 0) {
          return res.json({ produtos: [], total: 0, pagina: parseInt(pagina), totalPaginas: 0 });
        }
        
        // Extrair os IDs dos produtos
        const produtoCodigos = produtosDeposito.map(item => {
          // Tenta extrair o código numérico do campo Produto
          const match = item.Produto?.match(/\d+/);
          return match ? parseInt(match[0]) : null;
        }).filter(codigo => codigo !== null);
        
        filtro.Codigo = { $in: produtoCodigos };
      }
      
      // Aplicar filtro por categoria se fornecido
      if (categoria) {
        filtro.CategoriaID = categoria;
      }
      
      // Aplicar busca por texto se fornecida
      if (busca) {
        // Usar busca em campos específicos ao invés de índice de texto
        const termoBusca = new RegExp(busca, 'i');
        filtro.$or = [
          { Nome: termoBusca },
          { Descricao: termoBusca },
          { Codigo: isNaN(parseInt(busca)) ? undefined : parseInt(busca) }
        ].filter(Boolean);
      }
      
      // Aplicar filtro de preço se fornecido
      if (precoMin || precoMax) {
        filtro.$and = filtro.$and || [];
        const filtroPreco = {};
        
        if (precoMin && !isNaN(parseFloat(precoMin))) {
          filtroPreco.$gte = parseFloat(precoMin);
        }
        
        if (precoMax && !isNaN(parseFloat(precoMax))) {
          filtroPreco.$lte = parseFloat(precoMax);
        }
        
        filtro.$and.push({
          $or: [
            { PrecoVenda: filtroPreco },
            { Preco: filtroPreco }
          ]
        });
      }
      
      // Aplicar filtro de marcas se fornecido
      if (marcas) {
        const marcasList = marcas.split(',').filter(marca => marca.trim());
        if (marcasList.length > 0) {
          filtro.Marca = { $in: marcasList };
        }
      }
      
      // Configurar ordenação
      const ordenacaoOpcoes = {};
      switch (ordenacao) {
        case 'preco_asc':
          ordenacaoOpcoes.Preco = 1;
          break;
        case 'preco_desc':
          ordenacaoOpcoes.Preco = -1;
          break;
        case 'nome_desc':
          ordenacaoOpcoes.Nome = -1;
          break;
        case 'relevancia':
          if (opcoes.score) {
            ordenacaoOpcoes.score = { $meta: "textScore" };
          } else {
            ordenacaoOpcoes.Nome = 1;
          }
          break;
        case 'nome_asc':
        default:
          ordenacaoOpcoes.Nome = 1;
      }
      
      // Configurar paginação baseada em cursor ou página
      const paginaNum = parseInt(pagina);
      const limiteNum = parseInt(limite);
      const skip = cursor ? 0 : (paginaNum - 1) * limiteNum;
      
      // Se um cursor for fornecido, adicionar condição para buscar após o cursor
      if (cursor) {
        try {
          const cursorObj = JSON.parse(Buffer.from(cursor, 'base64').toString());
          const campoOrdenacao = Object.keys(ordenacaoOpcoes)[0];
          const direcao = ordenacaoOpcoes[campoOrdenacao];
          
          if (direcao === 1) {
            filtro[campoOrdenacao] = { $gt: cursorObj[campoOrdenacao] };
          } else {
            filtro[campoOrdenacao] = { $lt: cursorObj[campoOrdenacao] };
          }
        } catch (err) {
          console.error('Erro ao decodificar cursor:', err);
        }
      }
      
      // Executar consulta com projeção para retornar apenas campos necessários
      const produtos = await db.collection('DtoProduto')
        .find(filtro, { projection: {
          _id: 1,
          Nome: 1,
          Descricao: 1,
          Codigo: 1,
          Categoria: 1,
          CategoriaID: 1,
          Preco: 1,
          PrecoVenda: 1,
          Marca: 1,
          ImagemPrincipal: 1,
          ImagemUrl: 1,
          ImagemURL: 1,
          imagemUrl: 1,
          imagemURL: 1,
          imagem: 1,
          Imagem: 1
        }})
        .sort(ordenacaoOpcoes)
        .skip(skip)
        .limit(limiteNum)
        .toArray();
      
      // Buscar imagens para todos os produtos
      const produtoIds = produtos.map(p => p._id.toString());
      const imagens = await db.collection('DtoArquivos')
        .find({ 
          ReferenciaID: { $in: produtoIds },
          TipoArquivo: 'Produtos'
        })
        .toArray();
      
      // Mapear imagens por produto
      const imagensPorProduto = {};
      imagens.forEach(img => {
        if (!imagensPorProduto[img.ReferenciaID]) {
          imagensPorProduto[img.ReferenciaID] = [];
        }
        imagensPorProduto[img.ReferenciaID].push(img);
      });
      
      // Adicionar imagens aos produtos
      const produtosComImagens = produtos.map(produto => {
        const produtoImagens = imagensPorProduto[produto._id.toString()] || [];
        return {
          ...produto,
          imagens: produtoImagens,
          imagemPrincipal: produtoImagens.length > 0 ? produtoImagens[0].AWSLink : null
        };
      });
      
      // Contar total de produtos para paginação
      const total = await db.collection('DtoProduto').countDocuments(filtro);
      const totalPaginas = Math.ceil(total / limiteNum);
      
      // Gerar cursor para próxima página se houver produtos
      let proximoCursor = null;
      if (produtos.length === limiteNum) {
        const ultimoProduto = produtos[produtos.length - 1];
        const cursorObj = {
          _id: ultimoProduto._id,
          Nome: ultimoProduto.Nome,
          Preco: ultimoProduto.Preco
        };
        proximoCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');
      }
      
      // Retornar resultado com metadados de paginação
      res.json({
        produtos: produtosComImagens,
        total,
        pagina: paginaNum,
        totalPaginas,
        proximoCursor
      });
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      res.status(500).json({ message: 'Erro ao buscar produtos', erro: err.message });
    }
  });

  // Rota para obter um produto específico por ID com informações completas
  router.get('/:id', async (req, res) => {
    try {
      const produtoId = req.params.id;
      let produto;
      
      // Verificar se o ID é um ObjectId válido ou um código
      if (ObjectId.isValid(produtoId)) {
        produto = await db.collection('DtoProduto').findOne({ _id: new ObjectId(produtoId) });
      } else {
        // Tentar buscar por código se não for um ObjectId válido
        produto = await db.collection('DtoProduto').findOne({ Codigo: parseInt(produtoId) });
      }
      
      if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      
      // Buscar informações de estoque para o produto
      const estoque = await db.collection('DtoEstoqueDepositoProduto')
        .find({ ProdutoID: produto._id.toString() })
        .toArray();
      
      // Buscar depósitos para enriquecer as informações de estoque
      const depositoIds = estoque.map(item => item.DepositoID);
      const depositos = await db.collection('DtoEstoqueDeposito')
        .find({ _id: { $in: depositoIds.map(id => new ObjectId(id)) } })
        .toArray();
      
      // Mapear depósitos por ID para fácil acesso
      const depositosPorId = {};
      depositos.forEach(deposito => {
        depositosPorId[deposito._id.toString()] = deposito;
      });
      
      // Enriquecer informações de estoque com dados do depósito
      const estoqueCompleto = estoque.map(item => ({
        ...item,
        deposito: depositosPorId[item.DepositoID] || { Nome: 'Depósito Desconhecido' }
      }));
      
      // Buscar imagens do produto
      const imagens = await db.collection('DtoArquivos')
        .find({ 
          ReferenciaID: produto._id.toString(),
          TipoArquivo: 'Produtos'
        })
        .toArray();
      
      // Retornar produto com informações completas
      res.json({
        ...produto,
        estoque: estoqueCompleto,
        imagens,
        imagemPrincipal: imagens.length > 0 ? imagens[0].AWSLink : null
      });
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      res.status(500).json({ message: 'Erro ao buscar produto', erro: err.message });
    }
  });

  // Rota para obter imagens de um produto específico
  router.get('/:id/imagens', async (req, res) => {
    try {
      const produtoId = req.params.id;
      let referenciaId;
      
      // Verificar se o ID é um ObjectId válido ou um código
      if (ObjectId.isValid(produtoId)) {
        const produto = await db.collection('DtoProduto').findOne(
          { _id: new ObjectId(produtoId) },
          { projection: { _id: 1 } }
        );
        if (!produto) {
          return res.status(404).json({ message: 'Produto não encontrado' });
        }
        referenciaId = produto._id.toString();
      } else {
        // Tentar buscar por código se não for um ObjectId válido
        const produto = await db.collection('DtoProduto').findOne(
          { Codigo: parseInt(produtoId) },
          { projection: { _id: 1 } }
        );
        if (!produto) {
          return res.status(404).json({ message: 'Produto não encontrado' });
        }
        referenciaId = produto._id.toString();
      }
      
      // Buscar imagens do produto
      const imagens = await db.collection('DtoArquivos')
        .find({ ReferenciaID: referenciaId })
        .toArray();
      
      res.json(imagens);
    } catch (err) {
      console.error('Erro ao buscar imagens do produto:', err);
      res.status(500).json({ message: 'Erro ao buscar imagens do produto', erro: err.message });
    }
  });

  // Rota para obter disponibilidade de estoque de um produto por depósito
  router.get('/:id/estoque', async (req, res) => {
    try {
      const produtoId = req.params.id;
      let produto;
      
      // Verificar se o ID é um ObjectId válido ou um código
      if (ObjectId.isValid(produtoId)) {
        produto = await db.collection('DtoProduto').findOne(
          { _id: new ObjectId(produtoId) },
          { projection: { _id: 1, Codigo: 1 } }
        );
      } else {
        // Tentar buscar por código se não for um ObjectId válido
        produto = await db.collection('DtoProduto').findOne(
          { Codigo: parseInt(produtoId) },
          { projection: { _id: 1, Codigo: 1 } }
        );
      }
      
      if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      
      // Buscar estoque do produto em todos os depósitos
      const estoque = await db.collection('DtoEstoqueDepositoProduto')
        .find({ 
          $or: [
            { ProdutoID: produto._id.toString() },
            { Produto: { $regex: new RegExp(`^.*${produto.Codigo}.*$`) } }
          ]
        })
        .toArray();
      
      // Buscar informações dos depósitos
      const depositoIds = estoque.map(item => item.DepositoID).filter(Boolean);
      const depositos = depositoIds.length > 0 ?
        await db.collection('DtoEstoqueDeposito')
          .find({ _id: { $in: depositoIds.map(id => new ObjectId(id)) } })
          .toArray() : [];
      
      // Mapear depósitos por ID para fácil acesso
      const depositosPorId = {};
      depositos.forEach(deposito => {
        depositosPorId[deposito._id.toString()] = deposito;
      });
      
      // Enriquecer informações de estoque com dados do depósito
      const estoqueCompleto = estoque.map(item => ({
        depositoId: item.DepositoID,
        deposito: depositosPorId[item.DepositoID] ? depositosPorId[item.DepositoID].Nome : 'Depósito Desconhecido',
        saldo: item.Saldo,
        ultimaAtualizacao: item.UltimaAtualizacao
      }));
      
      res.json(estoqueCompleto);
    } catch (err) {
      console.error('Erro ao buscar estoque do produto:', err);
      res.status(500).json({ message: 'Erro ao buscar estoque do produto', erro: err.message });
    }
  });

  return router;
};