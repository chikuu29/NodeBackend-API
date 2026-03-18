

// const MongoDBManager = require('../../infrastructure/database/mongoServices');
const { mongoClient } = require('../../infrastructure/database/mongo')
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
// Absolute path to the storage folder (outside the src directory)

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(req.appName);

        const storagePath = path.resolve(__dirname, '../../storage/' + req.appName); // Adjust according to your folder structure
        // Ensure the folder exists
        // require('fs').mkdirSync(storagePath, { recursive: true });

        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
        cb(null, storagePath); // Folder for uploaded files
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`); // Unique filename
    }
});
const upload = multer({ storage: storage });


// const mongoConfig = readJsonFiles('./config/mongoConfig.json');

const generateConfig = async (req, res) => {

    try {
        // var refresh_token = req.cookies['refresh_token']
        // const projectName = req.body.projectName;
        const app_config = await mongoClient.find("app_config", { type: "menu", id: 1 }, {});
        if (app_config.length != 0) {
            // const message_info = { error: `User: ${userData.userName} already exists`, projectName, 'success': false, message: 'User already exists' };
            // logInfo({ ...message_info });
            const response = {
                success: true,
                result: { 'config': app_config[0]['config'] }
            }
            return res.status(200).json(response);
        } else {
            return res.status(200).json({
                "success": false,
                "result": []
            })
        }


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

}




const getTemplate = async (req, res) => {

    try {
        // var refresh_token = req.cookies['refresh_token']
        // const projectName = req.body.projectName;
        const id = req.query.id
        console.log(req.query);
        
        const template = await mongoClient.find("template",  req.query , {});
        if (template.length != 0) {

            const response = {
                success: true,
                result: template
            }
            return res.status(200).json(response);
        } else {
            return res.status(200).json({
                "success": false,
                "result": {}
            })
        }


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

}

const getNotifiction = async (req, res) => {
    return res.status(200).json({
        "success": true,
        "results": [
            { id: 1, info: "You have a new message", aName: "Alice" },
            { id: 2, info: "Class starts at 6 PM", aName: "Gym" },
        ]
    })
}

const getDataBaseStatisics = async (req, res) => {
    try {
        const result = await mongoClient.getStatistics(1024);
        if (result) {
            const response = {
                success: true,
                result: result
            }
            return res.status(200).json(response);
        } else {
            return res.status(200).json({
                "success": false,
                "result": {}
            })
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

}

// Upload API for multiple files
const uploadFile = async (req, res) => {
    console.log("===CALLING UPLOAD FILE===");

    upload.array('files', 10)(req, res, async (err) => { // Handle up to 10 files

        console.log(req);

        if (err) {
            return res.status(500).send({ success: false, message: `File upload error: ${err.message}` });
        }

        const files = req.files; // All files are available under the 'files' key

        // Check if any files were uploaded
        if (!files || files.length === 0) {
            return res.status(400).send({ success: false, message: 'No files uploaded.' });
        }

        // Base URL for serving the uploaded files
        const baseUrl = process.env.FILE_UPLOAD_URL || 'http://localhost:7000/public/storage/'; // Replace with actual URL

        // The directory where the uploaded files are stored (absolute path)
        const storageDirectory = path.resolve(__dirname, '../../storage/' + req.appName); // Adjust based on where your storage is

        // Create a detailed response message
        let responseMessage = 'Files uploaded successfully:';
        const fileDetails = files.map(file => ({
            filename: file.filename,             // Filename of the uploaded file
            originalName: file.originalname,     // Original filename uploaded by the user
            size: file.size,                     // Size of the file in bytes
            mimeType: file.mimetype,             // MIME type of the uploaded file
            absolutePath: path.join(storageDirectory, file.filename),   // URL to access the uploaded file
            accessObjectPath: `public/storage/${req.appName}/${file.filename}`, // Absolute path on server's filesystem
            accessUrl:''
        }));
        await mongoClient.insert("uploadFiles", {
            uploadFiles: fileDetails,
            appName: req.appName,
            ...req.tokenInfo
        });
        // Sending JSON response with file details
        res.status(200).send({
            success: true,
            message: responseMessage,
            uploadFiles: fileDetails
        });
    });
};


module.exports = {
    getTemplate,
    generateConfig,
    getNotifiction,
    getDataBaseStatisics,
    uploadFile
}