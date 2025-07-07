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

// Rota de upload otimizada
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
    const options = {
      folder: "cardapios",
      upload_preset: "cardapios_preset",
      use_filename: true,
      unique_filename: true,
      resource_type: fileType.includes('pdf') ? 'raw' : 'image',
      flags: fileType.includes('pdf') ? 'attachment' : null
    };

    // Configurações específicas para PDF
    if (fileType.includes('pdf')) {
      options.format = 'pdf';
      options.filename_override = `cardapio_${timestamp}.pdf`;
      options.type = 'authenticated'; // Acesso mais seguro
    } else {
      options.filename_override = `img_${timestamp}.jpg`;
    }

    const uploadResult = await cloudinary.uploader.upload(
      `data:${fileType.includes('pdf') ? 'application/pdf' : 'image/jpeg'};base64,${req.body.file}`,
      options
    );

    // Para PDFs, gera URL assinada com tempo de expiração
    let fileUrl = uploadResult.secure_url;
    if (fileType.includes('pdf')) {
      fileUrl = cloudinary.url(uploadResult.public_id, {
        resource_type: 'raw',
        type: 'authenticated',
        sign_url: true,
        secure: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // Expira em 1 hora
        flags: 'attachment',
        format: 'pdf'
      });
    }

    return res.json({
      success: true,
      fileUrl: fileUrl,
      fileType: fileType
    });

  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));