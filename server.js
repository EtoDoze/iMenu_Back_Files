import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';

import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

// Configuração do Cloudinary (substitua com suas credenciais)
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME || 'dmcmgwdu4',
  api_key: process.env.CLOUDINARY_KEY || 'xxxx', 
  api_secret: process.env.CLOUDINARY_SECRET || 'xxxx'
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Permite receber imagens em base64
app.use(express.static('public')); // Serve arquivos estáticos (opcional)

// Rota de upload (SIMPLIFICADA)
app.post('/api/cardapio', async (req, res) => {
  try {
    const { imagem, title, content, linksocial, privacidade } = req.body;

    // Faz upload direto para o Cloudinary
    const result = await cloudinary.uploader.upload(imagem, {
      folder: "capas",
      upload_preset: "cardapios_preset" // Configure no painel do Cloudinary
    });

    // Aqui você pode salvar os dados no seu banco de dados (opcional)
    // Exemplo: await Database.save({ title, content, imageUrl: result.secure_url });

    res.json({ 
      success: true,
      data: {
        imageUrl: result.secure_url, // URL pública da imagem
        title,
        content,
        linksocial,
        privacidade
      }
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ success: false, error: "Falha no upload da imagem" });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});