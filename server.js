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
app.use(express.json({ limit: '50mb' })); // Aumente o limite
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de log para depuração
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

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
      resource_type: fileType.includes('pdf') ? 'raw' : 'image',
      folder: "cardapios",
      use_filename: true,
      unique_filename: true,
      timestamp: timestamp
    };

    // Upload do arquivo
    const uploadResult = await cloudinary.uploader.upload(
      `data:${fileType.includes('pdf') ? 'application/pdf' : fileType};base64,${req.body.file}`,
      options
    );

    // Para PDFs, construa a URL de download corretamente
 // Dentro da rota /api/upload, na parte de PDFs:
if (fileType.includes('pdf')) {
  const publicIdWithExtension = `${uploadResult.public_id}.pdf`;
  
  const downloadUrl = cloudinary.url(publicIdWithExtension, {
    resource_type: 'raw',
    secure: true,
    flags: 'attachment',
    type: 'upload'
  });

  return res.json({
    success: true,
    fileUrl: downloadUrl,
    fileType: 'pdf',
    fileName: `cardapio_${timestamp}.pdf` // Nome consistente
  });
}

    // Para imagens
    return res.json({
      success: true,
      fileUrl: uploadResult.secure_url,
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

// Rota de saúde para verificar se o servidor está online
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Configuração do Cloudinary:', {
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY ? '***' : 'não configurado'
    });
});