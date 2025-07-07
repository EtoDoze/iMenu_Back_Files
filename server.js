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
    const { file, fileType } = req.body;
    
    // Configurações específicas para PDF
    const options = {
      resource_type: 'raw',
      type: 'upload',
      folder: "cardapios",
      use_filename: true,
      filename_override: 'cardapio.pdf', // Força o nome do arquivo
      flags: 'attachment'
    };

    const uploadResult = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${file}`,
      options
    );

    // URL de download garantida
    const downloadUrl = cloudinary.url(uploadResult.public_id, {
      resource_type: 'raw',
      type: 'upload',
      flags: 'attachment',
      secure: true,
      sign_url: true // Adiciona assinatura de segurança
    });

    res.json({ success: true, fileUrl: downloadUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, error: error.message });
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