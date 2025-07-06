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

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.post('/api/upload', async (req, res) => {
  try {
    if (!req.body || !req.body.file) {
      return res.status(400).json({ 
        success: false,
        error: "Dados do arquivo não recebidos" 
      });
    }

    const fileType = req.body.fileType || 'image';
    const timestamp = Date.now();

    if (fileType.includes('pdf')) {
      const uploadResult = await cloudinary.uploader.upload(
        `data:application/pdf;base64,${req.body.file}`, {
          resource_type: 'raw',
          folder: "cardapios",
          upload_preset: "cardapios_preset",
          format: 'pdf',
          type: 'private',  // Alterado para private
          discard_original_filename: true,
          unique_filename: true,
          filename_override: `cardapio_${timestamp}`
        }
      );

      // URL assinada para garantir acesso
      const signedUrl = cloudinary.url(uploadResult.public_id, {
        resource_type: 'raw',
        type: 'private',
        sign_url: true,
        secure: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600 // Expira em 1 hora
      });

      return res.json({
        success: true,
        fileUrl: signedUrl,
        fileType: 'pdf'
      });
    } else {
      // Código para imagens permanece o mesmo
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