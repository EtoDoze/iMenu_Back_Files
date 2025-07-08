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
// Substitua o app.use(cors()) atual por isso:
const corsOptions = {
  origin: ['http://127.0.0.1:5503', 'https://ifpi-picos.github.io/projeto-integrador-i-menu'], // Adicione todas as origens necessárias
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Adicione isso antes das rotas para lidar com requisições OPTIONS (preflight)
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de log
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Rota de upload otimizada
app.post('/api/upload', async (req, res) => {
    try {
        const { file, fileType } = req.body;
        
        const options = {
            folder: "cardapios",
            use_filename: true,
            unique_filename: true,
            resource_type: 'auto',
            content_disposition: 'attachment',
            flags: 'attachment'
        };

        if (fileType.includes('pdf')) {
            options.resource_type = 'raw';
            options.type = 'upload';
            options.filename_override = 'cardapio';
            options.content_disposition = 'attachment; filename="cardapio.pdf"';
            
            const uploadResult = await cloudinary.uploader.upload(
                `data:${fileType};base64,${file}`,
                options
            );

            // Gera URL de download direto
            const downloadUrl = cloudinary.url(uploadResult.public_id, {
                resource_type: 'raw',
                secure: true,
                flags: 'attachment',
                content_disposition: 'attachment; filename="cardapio.pdf"'
            });

            return res.json({
                success: true,
                fileUrl: downloadUrl,
                fileType: 'pdf',
                originalFilename: 'cardapio.pdf'
            });
        } else {
            // Para imagens
            options.resource_type = 'image';
            const uploadResult = await cloudinary.uploader.upload(
                `data:${fileType};base64,${file}`,
                options
            );

            return res.json({
                success: true,
                fileUrl: uploadResult.secure_url,
                fileType: fileType
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

// Rota de saúde
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'online',
        timestamp: new Date().toISOString(),
        cloudinary: {
          configured: !!process.env.CLOUDINARY_NAME
        }
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