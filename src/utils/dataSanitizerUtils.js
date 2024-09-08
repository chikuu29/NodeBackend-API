const Joi = require('joi');

const dataSanitizer = (fields, fieldsConfig, requestBody) => {
    const userData = {};
    const errorArr = [];

    for (const field of fields) {
        let { minLength, maxLength, pattern, dataType, required } = fieldsConfig[field];
        
        minLength = Number(minLength) || 0;
        maxLength = Number(maxLength) || 1000;

        let fieldSchema;
        dataType = dataType || '';

        switch (dataType) {
            case 'number':
                fieldSchema = Joi.number()
                    .min(minLength)
                    .max(maxLength);
                break;
            case 'boolean':
                fieldSchema = Joi.boolean();
                break;
            case 'date':
                fieldSchema = Joi.date();
                break;
            case 'array':
                fieldSchema = Joi.array().items(Joi.any()); // Adjust item validation as needed
                break;
            case 'object':
                fieldSchema = Joi.object();
                break;
            case 'string':
            default:
                fieldSchema = Joi.string()
                    .min(minLength)
                    .max(maxLength);
                
                if (pattern) {
                    fieldSchema = fieldSchema.pattern(new RegExp(pattern));
                }
                break;
        }

        if (required) {
            fieldSchema = fieldSchema.required();
        }

        const { error, value } = fieldSchema.validate(requestBody[field], { abortEarly: false });

        if (error) {
            errorArr.push({
                field,
                message: error.details.map(err => err.message).join(', ')
            });
        }

        userData[field] = value !== undefined ? value : requestBody[field];
    }

    if (errorArr.length > 0) {
        return { error: errorArr };
    }

    return userData;
};

module.exports = {
    dataSanitizer
};
