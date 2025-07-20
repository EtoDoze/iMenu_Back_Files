import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';
import multer from 'multer'; // Adicione esta linha

// Configuração do Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET 
};

if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.error('Erro: Configuração do Cloudinary incompleta!');
  process.exit(1);
}

cloudinary.config(cloudinaryConfig);

const app = express();

// Configuração do CORS
app.use(cors({
  origin: [
    'http://127.0.0.1:5503', 
    'https://ifpi-picos.github.io',
    'https://www.imenucorp.shop',
    'https://imenucorp.shop'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware para upload de arquivos
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

// Rota de upload otimizada para FormData
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'Nenhum arquivo enviado'
            });
        }

        const fileBuffer = req.file.buffer;
        const fileType = req.file.mimetype;
        const isImage = fileType.startsWith('image/');
        const isPDF = fileType === 'application/pdf';

        const options = {
            folder: "cardapios",
            use_filename: true,
            unique_filename: true,
            resource_type: 'auto'
        };

        if (isPDF) {
            // Configurações específicas para PDF
            options.resource_type = 'raw';
            options.type = 'upload';
            options.filename_override = req.file.originalname || 'cardapio.pdf';
            options.content_disposition = 'attachment'; // Isso força o download
            options.flags = 'attachment';
            
            const uploadResult = await cloudinary.uploader.upload(`data:${fileType};base64,${fileBuffer.toString('base64')}`, options);

            return res.json({
                success: true,
                fileUrl: uploadResult.secure_url,
                fileType: 'pdf',
                originalFilename: options.filename_override
            });
        } else if (isImage) {
            options.resource_type = 'image';
            const uploadResult = await cloudinary.uploader.upload(`data:${fileType};base64,${fileBuffer.toString('base64')}`, options);

            return res.json({
                success: true,
                fileUrl: uploadResult.secure_url,
                fileType: fileType
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'Tipo de arquivo não suportado'
            });
        }
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ 
            success: false,
            error: error.message
        });
    }
});

// Rota para forçar download de arquivos
app.get('/api/download', async (req, res) => {
  try {
    const { public_id } = req.query;
    
    if (!public_id) {
      return res.status(400).json({ error: 'ID do arquivo não fornecido' });
    }

    const downloadUrl = cloudinary.url(public_id, {
      resource_type: 'raw',
      secure: true,
      flags: 'attachment',
      content_disposition: 'attachment'
    });

    res.redirect(downloadUrl);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: 'Erro ao gerar URL de download' });
  }
});

// Rota de saúde melhorada
app.get('/health', (req, res) => {
    const status = {
        status: 'online',
        timestamp: new Date().toISOString(),
        cloudinary: {
            configured: !!process.env.CLOUDINARY_NAME,
            authenticated: !!cloudinary.config().api_key
        },
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
    };
    res.status(200).json(status);
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Configuração do Cloudinary:', {
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY ? '***' : 'não configurado'
    });
});
