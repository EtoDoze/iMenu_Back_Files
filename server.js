import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';

// Configurações para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Criar o servidor
const app = express();
const DOMAIN = process.env.DOMAIN || 'https://imenu-back-files.onrender.com';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Certificar que a pasta uploads existe
const uploadsDir = path.join(__dirname, 'uploads/capas');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Banco de dados em memória
const filesDB = {};

// Rota para upload
// Adicione esta configuração no início do arquivo, após as importações

// Modifique a rota de upload para usar o DOMAIN
app.post('/api/cardapio', upload.single('imagem'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "Nenhuma imagem foi enviada" 
      });
    }

    const { title, content, linksocial, privacidade } = req.body;
    const fileId = uuidv4();
    
    filesDB[fileId] = {
      originalName: req.file.originalname,
      serverName: req.file.filename,
      path: path.join(uploadsDir, req.file.filename),
      title,
      content,
      linksocial,
      privacidade,
      uploadedAt: new Date()
    };

    res.json({ 
      success: true,
      message: "Cardápio publicado com sucesso!",
      data: {
        downloadLink: `${DOMAIN}/download/${fileId}`,
        title,
        content,
        imageUrl: `${DOMAIN}/uploads/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ 
      success: false,
      message: "Erro interno no servidor" 
    });
  }
});

// Rota para download
app.get('/download/:fileId', (req, res) => {
  const fileInfo = filesDB[req.params.fileId];
  
  if (!fileInfo) {
    return res.status(404).send('Arquivo não encontrado');
  }

  res.download(fileInfo.path, fileInfo.originalName);
});

// Servir arquivos estáticos
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: err.message 
  });
});

// Iniciar o servidor
const PORT = 3009;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Uploads sendo salvos em: ${uploadsDir}`);
});