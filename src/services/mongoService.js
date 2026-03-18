const { MongoClient, ObjectId } = require("mongodb");
// const commonOperation = require('../commonServices/commonOperation');

let dbClient;
let dbInstance;
let connectionPromise;

const getMongoUri = () => process.env.MONGO_URI?.trim();

const maskMongoUrl = (url) => url.replace(/\/\/([^:/?#]+):([^@/]+)@/, '//***:***@');

const connect = async () => {
    if (dbInstance) {
        return dbInstance;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    console.log("🔍 TRYING TO ESTABLISH MONGO CONNECTION");

    connectionPromise = (async () => {
        const mongoUri = getMongoUri();

        if (!mongoUri) {
            throw new Error('MONGO_URI is missing. Add it to your .env file.');
        }

        console.log(maskMongoUrl(mongoUri));
        
        dbClient = new MongoClient(mongoUri, {
            maxPoolSize: 10,
            minPoolSize: 1,
            serverSelectionTimeoutMS: 5000,
        });
        await dbClient.connect();
        dbInstance = dbClient.db();
        console.log("===🎉🎉 CONNECTED TO MONGO DB 🎉🎉===");

        return dbInstance;
    })();

    try {
        return await connectionPromise;
    } catch (error) {
        console.error("❌ MONGO CONNECTION FAILED", error);
        connectionPromise = null;
        dbClient = null;
        dbInstance = null;
        throw error;
    }
};

class MongoDBManager {
    async init() {
        return connect();
    }

    async find(collectionName, query = {}) {
        const db = await this.init();
        const collection = db.collection(collectionName);
        return await collection.find(query).toArray();
    }

    async findOne(collectionName, query = {},projection={}) {
        const db = await this.init();
     
        const collection = db.collection(collectionName);
        return await collection.findOne(query,{ projection: projection});
    }

    async fetchById(collectionName, id) {
        const db = await this.init();
        const collection = db.collection(collectionName);
        return await collection.findOne({ _id: new ObjectId(id) });
    }

    async insert(collectionName, data) {
        const db = await this.init();
        const collection = db.collection(collectionName);
        const result = await collection.insertOne(data);
        return result;
    }

    async update(collectionName, match, data) {
        const db = await this.init();
        const collection = db.collection(collectionName);
        const result = await collection.updateOne(match, { $set: data });
        return result.modifiedCount > 0;
    }

    async delete(collectionName, id) {
        const db = await this.init();
        const collection = db.collection(collectionName);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    }

    async getStatistics(scale=1){
        const db = await this.init();
        return db.stats(scale)
    }
}

module.exports = {
    mongoClient: new MongoDBManager()
};
