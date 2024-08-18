import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

const uploadOnCloudinary = async (localPath) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    try {
        if (!localPath) return null;
        const response = await cloudinary.uploader.upload(localPath, {
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

const destroyCloudinary = async (publicId, type = 'image') => {
    try {
        if (!publicId) return null;
        await cloudinary.uploader.destroy(publicId, {
            resource_type: `${type}`,
        });
    } catch (error) {
        console.log('delete on cloudinary failed');
        throw error;
    }
};

export { uploadOnCloudinary, destroyCloudinary };
