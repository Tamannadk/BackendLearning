import {v2 as cloudinary} from 'cloudinary'
import fs from "fs"

// ⁡⁣⁢⁣𝗖𝗼𝗻𝗳𝗶𝗴𝘂𝗿𝗮𝘁𝗶𝗼𝗻⁡
cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME , 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath)
        {
            return null;
        }

        //⁡⁣⁢⁣𝘂𝗽𝗹𝗼𝗮𝗱 𝘁𝗵𝗲 𝗳𝗶𝗹𝗲 𝗼𝗻 𝗰𝗹𝗼𝘂𝗱𝗶𝗻𝗮𝗿𝘆⁡
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        //⁡⁣⁢⁣𝗳𝗶𝗹𝗲 𝗵𝗮𝘀 𝗯𝗲𝗲𝗻 𝘂𝗽𝗹𝗼𝗮𝗱𝗲𝗱 𝘀𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆⁡
        // console.log("File is uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)  //⁡⁣⁢⁣𝗿𝗲𝗺𝗼𝘃𝗲 𝘁𝗵𝗲 𝗹𝗼𝗰𝗮𝗹𝗹𝘆 𝘀𝗮𝘃𝗲𝗱 𝘁𝗲𝗺𝗽𝗼𝗿𝗮𝗿𝘆 𝗳𝗶𝗹𝗲 𝗮𝘀 𝘁𝗵𝗲 𝘂𝗽𝗹𝗼𝗮𝗱 𝗼𝗽𝗲𝗿𝗮𝘁𝗶𝗼𝗻 𝗴𝗼t 𝗳𝗮𝗶𝗹𝗲𝗱⁡
        return null;        
    }
}

export {uploadOnCloudinary}