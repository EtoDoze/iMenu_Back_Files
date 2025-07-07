import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';

// Configuração correta do Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, // Corrigido o nome da variável
  api_key: process.env.CLOUDINARY_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET 
});

const app = express();

// Middlewares corretos
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Rota de upload completa
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
          type: 'upload',
          use_filename: true,
          unique_filename: true,
          filename_override: `cardapio_${timestamp}.pdf`,
          flags: 'attachment' // Isso força o download
        }
      );

      // Modifica a URL para garantir o download
      let fileUrl = uploadResult.secure_url;
      
      // Se já não tiver o parâmetro de download, adiciona
      if (!fileUrl.includes('fl_attachment')) {
        fileUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
      }
      
      return res.json({
        success: true,
        fileUrl: fileUrl,
        fileType: 'pdf'
      });
    }
    else{
      // Upload de imagem
      const uploadResult = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${req.body.file}`, {
          folder: "cardapios",
          upload_preset: "cardapios_preset",
          filename_override: `img_${timestamp}.jpg`
        }
      );
      
      return res.json({
        success: true,
        fileUrl: uploadResult.secure_url,
        fileType: fileType
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