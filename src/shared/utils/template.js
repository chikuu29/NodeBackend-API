// src/utils/templateUtils.js
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

/**
 * Renders an HTML template with the provided data.
 *
 * @param {string} templatePath - The path to the HTML template file.
 * @param {Object} data - The data to inject into the template.
 * @returns {Promise<string>} - A promise that resolves with the rendered HTML string.
 */
const renderTemplate = async (templatePath, data) => {
    // Resolve the template path to the actual file location
    const fullTemplatePath = path.join(__dirname, '../public/template', templatePath);

    // Read the template file
    const template = await fs.promises.readFile(fullTemplatePath, 'utf-8');

    // Render the template with data
    return ejs.render(template, data);
};

module.exports = { renderTemplate };
