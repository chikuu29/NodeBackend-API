const fs = require('fs');
const path = require('path');
const {readServerConfigFiles}=require('../src/utils/fileUtils')
class ConfigLoader {
    constructor() {
        this.configs = {};
    }

    loadConfig(fileName) {
        const filePath = path.join(__dirname, 'config', fileName);
        console.log("filePath",filePath);
        
        try {
            const data = readServerConfigFiles(filePath);
            return data;
        } catch (err) {
            console.error(`Error reading config file ${fileName}:`, err);
            return {};
        }
    }

    initialize() {
        // Load all your JSON configuration files here
        this.configs.serverConfig = this.loadConfig('serverConfig.json');
        this.configs.databaseConfig = this.loadConfig('mongoConfig.json');
        this.configs.apiRequirementConfig = this.loadConfig('apiRequirements.json');
        // Add more configurations as needed
    }

    get(key) {
        return this.configs[key];
    }
}

// Initialize and export configuration loader
const configLoader = new ConfigLoader();
configLoader.initialize();
module.exports = configLoader;
