import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (filePath,folder = "weChat")=>{
    try{
        const result = await cloudinary.uploader.upload(filePath,{
            folder: folder,
            resource_type: "auto",
        });
        if(fs.existsSync(filePath)){
            fs.unlinkSync(filePath);
        }
        return result;

    } catch(error){
        if(fs.existsSync(filePath)){
            fs.unlinkSync(filePath);
        }
        throw error;
    }
};

export default cloudinary;
