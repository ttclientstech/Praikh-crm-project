const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../../config/cloudinary');
const { slugify } = require('transliteration');

const cloudinaryStorageUpload = ({
    entity,
    fileType = 'default',
    uploadFieldName = 'file',
    fieldName = 'file',
}) => {
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'parikh-crm',
            public_id: (req, file) => {
                const uniqueFileID = Math.random().toString(36).slice(2, 7);
                const extension = file.originalname.split('.').pop().toLowerCase();
                let originalname = '';
                if (req.body.seotitle) {
                    originalname = slugify(req.body.seotitle.toLocaleLowerCase());
                } else {
                    originalname = slugify(file.originalname.split('.')[0].toLocaleLowerCase());
                }

                // For 'raw' resource type, Cloudinary doesn't automatically add the extension to the public_id.
                // We should add it manually if we want the delivered URL to have the correct extension.
                // However, for 'image' type (which includes PDF transforms), Cloudinary handles extensions.
                // To be safe and consistent, we include it for non-image types.
                if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                    return `${originalname}-${uniqueFileID}.${extension}`;
                }
                return `${originalname}-${uniqueFileID}`;
            },
            resource_type: (req, file) => {
                const extension = file.originalname.split('.').pop().toLowerCase();
                // We'll treat common images as 'image' and everything else (including PDFs) as 'raw' 
                // for more reliable document delivery.
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                    return 'image';
                }
                return 'raw';
            },
        },
    });

    const multerStorage = multer({ storage: storage }).single('file');

    return (req, res, next) => {
        multerStorage(req, res, (err) => {
            if (err) {
                return next(err);
            }
            if (req.file) {
                req.upload = {
                    fileName: req.file.filename,
                    fieldExt: `.${req.file.originalname.split('.').pop()}`,
                    entity: entity,
                    fieldName: fieldName,
                    fileType: fileType,
                    filePath: req.file.path,
                };
                req.body[fieldName] = req.file.path;
            }
            next();
        });
    };
};

module.exports = cloudinaryStorageUpload;
