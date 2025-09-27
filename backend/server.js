const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./config/database');
const { ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar ao banco de dados
let db;
connectToDatabase()
  .then((database) => {
    db = database;
    // Iniciar o servidor após conectar ao banco de dados
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });

// Rota para obter o WhatsApp (telefone) de um depósito/loja
app.get('/api/depositos/:id/whatsapp', async (req, res) => {
  try {
    const id = req.params.id
    const DEFAULT_TEST_NUMBER = '5561984498130'
    const collection = db.collection('DtoEstoqueDeposito')
    let query
    try {
      // tenta como ObjectId válido
      query = { _id: new ObjectId(id) }
    } catch {
      // fallback: id como string
      query = { _id: id }
    }
    const depo = await collection.findOne(query)
    if (!depo) return res.json({ numero: DEFAULT_TEST_NUMBER, source: 'default' })

    const raw = depo.telefone ?? depo.Telefone ?? depo.whatsapp ?? depo.WhatsApp ?? ''
    const digits = String(raw).replace(/\D+/g, '')
    const numero = digits.length >= 10 ? digits : DEFAULT_TEST_NUMBER
    res.json({ numero, source: digits ? 'deposito' : 'default' })
  } catch (err) {
    console.error('Erro ao buscar WhatsApp do depósito:', err)
    res.status(500).json({ message: 'Erro ao buscar WhatsApp do depósito' })
  }
});
  })
  .catch((err) => {
    console.error('Falha ao iniciar o servidor:', err);
  });

// Rota para obter todos os depósitos/lojas
app.get('/api/depositos', async (req, res) => {
  try {
    const depositos = await db.collection('DtoEstoqueDeposito').find({}).toArray();
    res.json(depositos);
  } catch (err) {
    console.error('Erro ao buscar depósitos:', err);
    res.status(500).json({ message: 'Erro ao buscar depósitos' });
  }
});

// Rota para obter produtos (com suporte a paginação)
app.get('/api/produtos', async (req, res) => {
  try {
    const depositoId = req.query.depositoId;
    const search = (Array.isArray(req.query.search) ? req.query.search[0] : req.query.search) || '';
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const rawOffset = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
    // Não alterar comportamento se limit/offset não forem enviados
    const limit = rawLimit !== undefined ? Math.max(1, Math.min(200, parseInt(rawLimit))) : undefined;
    const offset = rawOffset !== undefined ? Math.max(0, parseInt(rawOffset)) : undefined;

    if (depositoId) {
      // Buscar produtos de um depósito específico
      const produtosDeposito = await db.collection('DtoEstoqueDepositoProduto')
        .find({ DepositoID: depositoId })
        .toArray();
      
      console.log(`Encontrados ${produtosDeposito.length} produtos no depósito ${depositoId}`);
      
      if (produtosDeposito.length === 0) {
        return res.json({ items: [], total: 0, hasMore: false });
      }
      
      // Extrair os códigos dos produtos (campo Produto contém o código)
      // Filtrar somente com saldo > 0
      const comSaldo = produtosDeposito.filter(item => {
        const saldo = Number(item.Saldo ?? item.Quantidade ?? item.Qtd ?? 0);
        return saldo > 0;
      });
      const produtoCodigos = comSaldo.map(item => parseInt(String(item.Produto).match(/\d+/)?.[0] || '0'));
      
      console.log('Códigos de produtos com saldo > 0:', produtoCodigos.length);
      
      const query = {
        Codigo: { $in: produtoCodigos },
        ...(search ? { Nome: { $regex: search, $options: 'i' } } : {})
      };
      const collection = db.collection('DtoProduto');
      const total = await collection.countDocuments(query);
      let cursor = collection.find(query).sort({ LastUpdate: -1, _id: -1 });
      if (offset !== undefined) cursor = cursor.skip(offset);
      if (limit !== undefined) cursor = cursor.limit(limit);
      let items = await cursor.toArray();

      // Helpers para extrair preço/saldo de forma resiliente
      const getPreco = (rec) => {
        // priorizar campos comuns
        const pri = Number(rec.Preco ?? rec.PrecoVenda ?? rec.Valor ?? rec.ValorVenda ?? rec.PVenda ?? 0)
        if (pri > 0) return pri
        // fallback heurístico: pega o primeiro campo numérico com nome que contenha 'preco' ou 'valor'
        for (const [k, v] of Object.entries(rec)) {
          if (/preco|valor/i.test(k) && typeof v === 'number' && v > 0) return Number(v)
        }
        return 0
      }
      const getSaldo = (rec) => {
        const pri = Number(rec.Saldo ?? rec.Quantidade ?? rec.Qtd ?? rec.QtdSaldo ?? 0)
        if (pri > 0) return pri
        for (const [k, v] of Object.entries(rec)) {
          if (/saldo|quantidade|qtd/i.test(k) && typeof v === 'number' && v > 0) return Number(v)
        }
        return 0
      }

      // Injetar preço do depósito e garantir somente saldo > 0
      const precoPorCodigo = new Map();
      const saldoPorCodigo = new Map();
      comSaldo.forEach(rec => {
        const codigo = parseInt(String(rec.Produto).match(/\d+/)?.[0] || '0');
        const preco = getPreco(rec);
        const saldo = getSaldo(rec);
        precoPorCodigo.set(codigo, preco);
        saldoPorCodigo.set(codigo, saldo);
      });
      const buildPreco = (p, code) => {
        const precoDeposito = Number(precoPorCodigo.get(code) ?? 0)
        const precoProduto = Number(p.PrecoVenda ?? p.ValorMinimo ?? p.Preco ?? 0)
        // Priorizar preço do depósito quando existir; senão, usar PrecoVenda do produto
        return precoDeposito > 0 ? precoDeposito : precoProduto
      }

      items = items
        .filter(p => {
          const code = parseInt(String(p.Codigo).match(/\d+/)?.[0] || '0')
          return (saldoPorCodigo.get(code) || 0) > 0
        })
        .map(p => {
          const code = parseInt(String(p.Codigo).match(/\d+/)?.[0] || '0')
          const preco = buildPreco(p, code)
          const promocao = !!p.Promocao
          const promocaoValor = Number(p.PromocaoValor ?? 0)
          return {
            ...p,
            Preco: preco,
            EmPromocao: promocao,
            PrecoPromocional: promocao && promocaoValor > 0 ? promocaoValor : undefined,
            Saldo: saldoPorCodigo.get(code) || 0
          }
        });
      
      res.json({ items, total, hasMore: limit !== undefined ? offset + items.length < total : false });
    } else {
      // Sem depósito: retorna com paginação opcional
      const query = search ? { Nome: { $regex: search, $options: 'i' } } : {};
      const collection = db.collection('DtoProduto');
      const total = await collection.countDocuments(query);
      let cursor = collection.find(query).sort({ LastUpdate: -1, _id: -1 });
      if (offset !== undefined) cursor = cursor.skip(offset);
      if (limit !== undefined) cursor = cursor.limit(limit);
      const items = await cursor.toArray();
      
      if (limit === undefined && offset === undefined) {
        // Compatibilidade: se não veio paginação, mantém retorno antigo (array simples)
        return res.json(items);
      }
      
      res.json({ items, total, hasMore: limit !== undefined ? offset + items.length < total : false });
    }
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
});

// Rota para obter um produto específico por ID
app.get('/api/produtos/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const depositoId = (Array.isArray(req.query.depositoId) ? req.query.depositoId[0] : req.query.depositoId) || '';
    const produto = await db.collection('DtoProduto').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // preço/saldo padrão vindos do próprio produto (fallback)
    let preco = Number(produto.PrecoVenda ?? produto.ValorMinimo ?? produto.Preco ?? 0) || 0;
    let saldo = Number(produto.EstoqueSaldo ?? 0) || 0;

    if (depositoId) {
      // buscar no depósito e tentar casar o código
      const depoItems = await db.collection('DtoEstoqueDepositoProduto')
        .find({ DepositoID: depositoId })
        .toArray();

      const code = parseInt(String(produto.Codigo).match(/\d+/)?.[0] || '0');
      const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
      const nomeProd = norm(produto.Nome);

      // helpers iguais aos usados nas outras rotas
      const getPreco = (rec) => {
        const pri = Number(rec.Preco ?? rec.PrecoVenda ?? rec.Valor ?? rec.ValorVenda ?? rec.PVenda ?? 0);
        if (pri > 0) return pri;
        for (const [k, v] of Object.entries(rec)) {
          if (/preco|valor/i.test(k) && typeof v === 'number' && v > 0) return Number(v);
        }
        return 0;
      };
      const getSaldo = (rec) => {
        const pri = Number(rec.Saldo ?? rec.Quantidade ?? rec.Qtd ?? rec.QtdSaldo ?? 0);
        if (pri > 0) return pri;
        for (const [k, v] of Object.entries(rec)) {
          if (/saldo|quantidade|qtd/i.test(k) && typeof v === 'number' && v > 0) return Number(v);
        }
        return 0;
      };

      let match = depoItems.find((rec) => {
        const codigoRec = parseInt(String(rec.Produto).match(/\d+/)?.[0] || '0');
        return codigoRec === code;
      });
      // fallback por nome caso código não bata (igualdade ou contains nos dois sentidos)
      if (!match) {
        match = depoItems.find((rec) => {
          const n = norm(rec.Produto)
          return n === nomeProd || n.includes(nomeProd) || nomeProd.includes(n)
        });
      }

      if (match) {
        const precoDep = getPreco(match);
        const saldoDep = getSaldo(match);
        if (precoDep > 0) preco = precoDep;
        if (saldoDep > 0) saldo = saldoDep;
      }
    }

    // salvaguardas finais de preço
    if (!preco || preco <= 0) {
      const pf = Number(produto.PrecoVenda ?? 0)
      const vm = Number(produto.ValorMinimo ?? 0)
      preco = pf > 0 ? pf : (vm > 0 ? vm : 0)
    }
    const promocao = !!produto.Promocao;
    const promocaoValor = Number(produto.PromocaoValor ?? 0);
    const precoPromocional = promocao && promocaoValor > 0 ? promocaoValor : undefined
    if (!preco || preco <= 0) {
      if (precoPromocional) preco = precoPromocional
    }

    return res.json({
      ...produto,
      Preco: preco,
      Saldo: saldo,
      EmPromocao: promocao,
      PrecoPromocional: precoPromocional
    });
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ message: 'Erro ao buscar produto' });
  }
});

// Rota para obter imagens de um produto específico (com limit e projeção de campos)
app.get('/api/produtos/:id/imagens', async (req, res) => {
  try {
    const produtoId = req.params.id;
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = rawLimit !== undefined ? Math.max(1, Math.min(50, parseInt(rawLimit))) : undefined; // default: sem limite (compatibilidade)
    const fieldsParam = Array.isArray(req.query.fields) ? req.query.fields[0] : req.query.fields; // ex: 'AWSLink,NomeArquivo'
    let projection = undefined;
    if (fieldsParam && typeof fieldsParam === 'string') {
      projection = fieldsParam.split(',').map(s => s.trim()).filter(Boolean).reduce((acc, f) => ({ ...acc, [f]: 1 }), {});
    }

    let cursor = db.collection('DtoArquivos')
      .find({ ReferenciaID: produtoId }, projection ? { projection } : undefined)
      .sort({ DataUpload: -1, _id: -1 });
    if (limit !== undefined) cursor = cursor.limit(limit);
    const imagens = await cursor.toArray();
    
    console.log(`Encontradas ${imagens.length} imagens para o produto ${produtoId}`);
    
    res.json(imagens);
  } catch (err) {
    console.error('Erro ao buscar imagens do produto:', err);
    res.status(500).json({ message: 'Erro ao buscar imagens do produto' });
  }
});

// Rota para obter todas as categorias de produtos
app.get('/api/categorias', async (req, res) => {
  try {
    // Buscar categorias na coleção dtoCategoriaProduto
    const categorias = await db.collection('DtoCategoriaProduto').find({}).toArray();
    console.log(`Encontradas ${categorias.length} categorias`);
    res.json(categorias);
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    res.status(500).json({ message: 'Erro ao buscar categorias' });
  }
});

// Rota para obter produtos por categoria (com paginação opcional)
app.get('/api/produtos/categoria/:categoriaId', async (req, res) => {
  try {
    const categoriaId = req.params.categoriaId;
    const depositoId = (Array.isArray(req.query.depositoId) ? req.query.depositoId[0] : req.query.depositoId) || '';
    const search = (Array.isArray(req.query.search) ? req.query.search[0] : req.query.search) || '';
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const rawOffset = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
    const limit = rawLimit !== undefined ? Math.max(1, Math.min(200, parseInt(rawLimit))) : undefined;
    const offset = rawOffset !== undefined ? Math.max(0, parseInt(rawOffset)) : undefined;

    let codigoFilter = undefined;
    let precoPorCodigo = new Map();
    let saldoPorCodigo = new Map();
    if (depositoId) {
      const depoItems = await db.collection('DtoEstoqueDepositoProduto')
        .find({ DepositoID: depositoId })
        .toArray();
      const comSaldo = depoItems.filter(item => Number(item.Saldo ?? item.Quantidade ?? item.Qtd ?? 0) > 0);
      const codigos = comSaldo.map(item => parseInt(String(item.Produto).match(/\d+/)?.[0] || '0'));
      codigoFilter = { Codigo: { $in: codigos } };
      comSaldo.forEach(rec => {
        const codigo = parseInt(String(rec.Produto).match(/\d+/)?.[0] || '0');
        const preco = Number(rec.Preco ?? rec.PrecoVenda ?? rec.Valor ?? 0);
        const saldo = Number(rec.Saldo ?? rec.Quantidade ?? rec.Qtd ?? 0);
        precoPorCodigo.set(codigo, preco);
        saldoPorCodigo.set(codigo, saldo);
      });
    }

    const query = {
      CategoriaID: categoriaId,
      ...(codigoFilter || {}),
      ...(search ? { Nome: { $regex: search, $options: 'i' } } : {})
    };
    const collection = db.collection('DtoProduto');
    const total = await collection.countDocuments(query);
    let cursor = collection.find(query).sort({ LastUpdate: -1, _id: -1 });
    if (offset !== undefined) cursor = cursor.skip(offset);
    if (limit !== undefined) cursor = cursor.limit(limit);
    let items = await cursor.toArray();

    if (depositoId) {
      const buildPreco = (p, code) => {
        const precoDeposito = Number(precoPorCodigo.get(code) ?? 0)
        const precoProduto = Number(p.PrecoVenda ?? p.ValorMinimo ?? p.Preco ?? 0)
        return precoDeposito > 0 ? precoDeposito : precoProduto
      }
      items = items
        .filter(p => {
          const code = parseInt(String(p.Codigo).match(/\d+/)?.[0] || '0')
          return (saldoPorCodigo.get(code) || 0) > 0
        })
        .map(p => {
          const code = parseInt(String(p.Codigo).match(/\d+/)?.[0] || '0')
          const preco = buildPreco(p, code)
          const promocao = !!p.Promocao
          const promocaoValor = Number(p.PromocaoValor ?? 0)
          return {
            ...p,
            Preco: preco,
            EmPromocao: promocao,
            PrecoPromocional: promocao && promocaoValor > 0 ? promocaoValor : undefined,
            Saldo: saldoPorCodigo.get(code) || 0
          }
        });
    }

    if (limit === undefined && offset === undefined) {
      // compat: retorna como array simples quando não há paginação
      return res.json(items);
    }

    console.log(`Encontrados ${items.length}/${total} produtos na categoria ${categoriaId}`);
    res.json({ items, total, hasMore: limit !== undefined ? offset + items.length < total : false });
  } catch (err) {
    console.error('Erro ao buscar produtos por categoria:', err);
    res.status(500).json({ message: 'Erro ao buscar produtos por categoria' });
  }
});