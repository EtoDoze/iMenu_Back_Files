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

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rota de upload
app.post('/api/cardapio', async (req, res) => {
  try {
    console.log("Corpo recebido:", req.body);

    const { imagem, arquivo, tipo } = req.body;

    if (imagem) {
      // Upload de imagem
      const uploadResult = await cloudinary.uploader.upload(`data:image/jpeg;base64,${imagem}`, {
        folder: "cardapios",
        upload_preset: "cardapios_preset"
      });

      return res.json({
        success: true,
        type: 'image',
        imageUrl: uploadResult.secure_url
      });

    } else if (arquivo && tipo) {
      // Upload de PDF ou outro tipo raw
      const uploadResult = await cloudinary.uploader.upload(`data:${tipo};base64,${arquivo}`, {
        folder: "cardapios",
        resource_type: "raw"
      });

      return res.json({
        success: true,
        type: 'file',
        fileUrl: uploadResult.secure_url
      });

    } else {
      return res.status(400).json({ 
        success: false,
        error: "Nenhum dado válido para upload foi fornecido." 
      });
    }

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
