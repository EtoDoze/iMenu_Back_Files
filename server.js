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

// Configuração do CORS mais robusta
const corsOptions = {
  origin: [
    'http://127.0.0.1:5503', 
    'https://ifpi-picos.github.io',
    'https://ifpi-picos.github.io/projeto-integrador-i-menu'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Configuração dos middlewares com limites aumentados
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Middleware de log melhorado
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});

// Rota de upload de foto de perfil otimizada
app.post('/api/upload-profile-pic', async (req, res) => {
    try {
        console.log('Iniciando upload de foto de perfil...');
        
        if (!req.body?.file) {
            console.error('Dados da foto não fornecidos');
            return res.status(400).json({ 
                success: false,
                error: 'Por favor, envie a imagem no campo "file"' 
            });
        }

        // Configurações específicas para fotos de perfil
        const uploadOptions = {
            folder: "profile_pictures",
            width: 300,
            height: 300,
            crop: "fill",
            quality: "auto:best",
            format: "jpg",
            resource_type: "image",
            faces: true,
            detection: "faces"
        };

        console.log('Enviando para Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(
            `data:image/jpeg;base64,${req.body.file}`,
            uploadOptions
        );

        console.log('Upload concluído com sucesso:', uploadResult);
        
        res.json({
            success: true,
            fileUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id
        });

    } catch (error) {
        console.error("Erro durante o upload:", {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        
        res.status(500).json({ 
            success: false,
            error: 'Erro ao processar a imagem',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});



// Rota de upload otimizada
app.post('/api/upload', async (req, res) => {
    try {
        const { file, fileType, isCardapio } = req.body;
        
        const options = {
            folder: "cardapios",
            use_filename: true,
            unique_filename: true,
            resource_type: 'auto'
        };

        if (fileType.includes('pdf')) {
            // Configurações específicas para PDFs (forçar download)
            options.resource_type = 'raw';
            options.type = 'upload';
            options.filename_override = 'cardapio';
            options.content_disposition = 'attachment; filename="cardapio.pdf"';
            options.flags = 'attachment';
            
            const uploadResult = await cloudinary.uploader.upload(
                `data:${fileType};base64,${file}`,
                options
            );

            const fileUrl = cloudinary.url(uploadResult.public_id, {
                resource_type: 'raw',
                secure: true,
                flags: 'attachment',
                content_disposition: 'attachment; filename="cardapio.pdf"'
            });

            return res.json({
                success: true,
                fileUrl: fileUrl,
                fileType: 'pdf',
                originalFilename: 'cardapio.pdf'
            });
        } else {
            // Para imagens (visualização normal)
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