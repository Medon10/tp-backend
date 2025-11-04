import multer from 'multer';
import path from 'path';
// Configurar almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/destinos/'); // Carpeta donde se guardarán
    },
    filename: (req, file, cb) => {
        // Nombre único: timestamp + nombre original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'destino-' + uniqueSuffix + path.extname(file.originalname));
    }
});
// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG y WEBP'));
    }
};
export const uploadDestinyImage = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    },
    fileFilter: fileFilter
});
//# sourceMappingURL=uploadImage.js.map