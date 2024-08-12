import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localPath) => {
    try {
        if (!localPath) return null;
        const response = cloudinary.uploader.upload(localPath, {
            resource_type: 'auto',
        });
        console.log('file is uploaded', response);
        fs.unlinkSync(localPath);
        return response;
    } catch (error) {
        console.error('error in uploading file', error);
        fs.unlinkSync(localPath);
        return null;
    }
};

export { uploadOnCloudinary };
