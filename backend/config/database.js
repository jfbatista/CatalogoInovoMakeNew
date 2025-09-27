const { MongoClient } = require('mongodb');

// URL de conexão com o MongoDB
const url = 'mongodb://localhost:27017';
const dbName = '6cdcaadd-b559-4d49-a29b-4176dccdb363';

async function connectToDatabase() {
  try {
    // Conectar ao servidor MongoDB
    const client = new MongoClient(url);
    await client.connect();
    console.log('Conectado com sucesso ao MongoDB!');
    
    // Acessar o banco de dados
    const db = client.db(dbName);
    return db;
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err.message);
    throw err;
  }
}

module.exports = { connectToDatabase };