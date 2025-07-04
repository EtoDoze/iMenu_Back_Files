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

// Rota de upload atualizada
app.post('/api/upload', async (req, res) => {
  try {
    if (!req.body || !req.body.file) {
      return res.status(400).json({ 
        success: false,
        error: "Dados do arquivo não recebidos" 
      });
    }

    let uploadResult;
    const fileType = req.body.fileType || 'image';

    if (fileType.includes('pdf')) {
      uploadResult = await cloudinary.uploader.upload(
        `data:application/pdf;base64,${req.body.file}`, {
          resource_type: 'raw',
          folder: "cardapios",
          upload_preset: "cardapios_preset"
        }
      );
    } else {
      uploadResult = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${req.body.file}`, {
          folder: "cardapios",
          upload_preset: "cardapios_preset"
        }
      );
    }

    
    res.json({
      success: true,
      fileUrl: uploadResult.secure_url,
      fileType: fileType
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