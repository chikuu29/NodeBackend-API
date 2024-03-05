const { readJsonFiles, checkValidKeyInDictionary, validateAccessToken } = require('../commonServices/commonOperation');
const MongoDBManager = require('../commonServices/mongoServices');
const otherConfig = readJsonFiles('./applicationConfig/otherFeaturesConfigs.json');
const apiRequirementsConfig = readJsonFiles('./applicationConfig/apiRequirements.json');

const mongoConfig = readJsonFiles('./applicationConfig/mongoConfig.json');
const auth = mongoConfig.auth;
const mongoDBManagerObj = new MongoDBManager(auth.databaseName);  // Instantiate the MongoDBManager

const APIMiddleware = async (req, res, next) => {
    try {
        // Check if the request is to an API endpoint
        const requestBody = req.body;
        console.log('requestBody', requestBody);
        const apiKey = requestBody.apiKey;
        const projectName = requestBody.projectName;
        if (!apiKey || !projectName) {
            return res.status(400).json({ message: 'Please provide apiKey & projectName', status: 400 });
        }
        if (!apiRequirementsConfig[projectName]) {
            return res.status(400).json({ message: 'projectName does not exist', status: 400 });
        }
        if (apiKey !== otherConfig[projectName].apiKey) {
            return res.status(403).json({ error: 'Access Forbidden', status: 403 });
        }
        console.log('request.path', req.path);
        if (req.path.startsWith('/Auth/')) {
            if (!apiRequirementsConfig[projectName]) {
                return res.status(400).json({ message: 'projectName does not exist', status: 403 });
            }
            const accessToken = req.headers.authorization.split('Bearer ').pop();
            const tokenInfo = validateAccessToken(accessToken, otherConfig[projectName].tokenConfig.secretKey);
            if (tokenInfo) {
                if (req.path.startsWith('/Auth/roleAccess/')) {
                    if (!await isAllowed(req, tokenInfo)) {
                        return res.status(403).json({ error: 'Access Forbidden', errorCode: 403 });
                    }
                }
                req.tokenInfo = tokenInfo;
                return next();
            } else {
                return res.status(401).json({ error: 'Invalid or expired access token', errorCode: 401 });
            }
        }
        // Pass the request to the next middleware or route handler
        return next();
    } catch (err) {
        console.error('Exception in middleware', err);
        return res.status(500).json({ error: 'Internal Server Error', status: 500 });
    }
};

const isAllowed = async(req, tokenInfo) => {
    try {
        const projectName = req.body.projectName;
        console.log(`API view being called: ${req.path}`);
        const tempArr = req.path.split('/');
        const viewClass = tempArr[tempArr.length-2];
        console.log(`API view being called: ${viewClass}`);
        const queryConditions = {
            '$or': [
                { 'settingName': "ApisAllowedRoles" },
                { 'settingName': "userIdWithRoles" }
            ]
        };
        const rolesInfoArr = await mongoDBManagerObj.findDocuments(mongoConfig[projectName].apiSettings, queryConditions, {});
        let apisAllowedRoles = {};
        let userIdWithRoles = {};
        for (const record of rolesInfoArr) {
            if (record.settingName === 'ApisAllowedRoles') {
                apisAllowedRoles = record[projectName][viewClass] || {};
            } else if (record.settingName === 'userIdWithRoles') {
                userIdWithRoles = record[projectName][tokenInfo.userName] || {};
            }
        }
        return Object.keys(apisAllowedRoles).some(role => userIdWithRoles[role]);
    } catch (err) {
        console.error('Exception in middleware', err);
        return false;
    }
};



module.exports = APIMiddleware;
