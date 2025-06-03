import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';

// Configuração do Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET
});

const app = express();

// Middlewares CORRIGIDOS (adicione limite maior para imagens)
app.use(cors());
app.use(express.json({ limit: '25mb' })); // Aumente o limite para imagens grandes
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Rota de upload CORRIGIDA
app.post('/api/cardapio', async (req, res) => {
  try {
    console.log("Corpo recebido:", req.body); // Debug
    
    if (!req.body || !req.body.imagem) {
      return res.status(400).json({ 
        success: false,
        error: "Dados da imagem não recebidos" 
      });
    }

    const uploadResult = await cloudinary.uploader.upload(`data:image/jpeg;base64,${req.body.imagem}`, {
      folder: "cardapios",
      upload_preset: "cardapios_preset"
    });

    res.json({
      success: true,
      imageUrl: uploadResult.secure_url
    });

  } catch (error) {
    console.error("Erro detalhado:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));