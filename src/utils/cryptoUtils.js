const fs = require('fs');
const crypto = require('crypto');
// const key = 'QHlPYy2x4kPbWThoF63YXs9x345EmfgjQK7nsvfC2H0=';
const SERVER_CONFIG=require('../config/serverConfig.json')

const encryptJsonFile = (filename) => {
    try {

        const data = fs.readFileSync(filename, 'utf8');
        const cipher = crypto.createCipher('aes-256-cbc', key);
        let encryptedData = cipher.update(data, 'utf8', 'hex');
        encryptedData += cipher.final('hex');
        fs.writeFileSync(filename + '.enc', encryptedData);
    } catch (err) {
        console.error("Error in reading file", err);
    }
};

const decryptJsonFile = (filename) => {
    try {
        console.log("===CALLING decryptJsonFile");
        console.log(SERVER_CONFIG);
        const encryptedData = fs.readFileSync(filename, 'utf8');
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
        decryptedData += decipher.final('utf8');
        return JSON.parse(decryptedData);
    } catch (err) {
        console.error("Error in reading file", err);
        return {};
    }
};

module.exports={
    encryptJsonFile,
    decryptJsonFile
}