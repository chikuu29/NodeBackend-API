const fs = require('fs');
const key = 'QHlPYy2x4kPbWThoF63YXs9x345EmfgjQK7nsvfC2H0=';

/**
 * Reads a JSON file, with an option to read from an encrypted file.
 *
 * @author SURYANARAYAN BISWAL
 * @param {string} filePath - The path to the JSON file.
 * @param {boolean} [readEncryptFile=false] - Flag to indicate if the file is encrypted. If true, it reads from an encrypted file.
 * @returns {Object} - The parsed JSON object. Returns an empty object if there is an error.
 */
const readServerConfigFiles = (filePath, readEncryptFile = false) => {
  console.log("===CALLING readServerConfigFiles ===",readEncryptFile);
  try {
    if (readEncryptFile) {
      return decryptJsonFile(filePath + '.enc');
    } else {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('error in reading json file-->', err);
    return {};
  }
};

// Function to get the absolute path of a file
const getFilePath = (relativePath) => {
  return path.resolve(__dirname, relativePath);
};


// Function to read a file asynchronously
const readFileAsync = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// Function to read a file synchronously
const readFileSync = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return data;
  } catch (err) {
    throw new Error(`Error reading file: ${err.message}`);
  }
};


module.exports = {
  readServerConfigFiles,
  getFilePath,
  readFileAsync,
  readFileSync
}