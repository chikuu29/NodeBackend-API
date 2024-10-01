const { MongoClient, ObjectId } = require("mongodb");
// const commonOperation = require('../commonServices/commonOperation');

const configLoader = require('../configLoader');

// const mongoConfig = commonOperation.readJsonFiles('./src/config/mongoConfig.json');
const MONGO_CONNECTION_CONFIG = configLoader.get('databaseConfig');

let dbClient;

const connect = async () => {
    if (dbClient && dbClient.isConnected()) {
        console.log("✅ Using existing MongoDB connection.");
        return dbClient.db(); // Reuse the existing connection
    }

    console.log("🔍 TRYING TO ESTABLISH MONGO CONNECTION");

    try {
        let url;
        if (MONGO_CONNECTION_CONFIG.DB_CONNECTION_TYPE === "ATLAS") {
            const CONNECTION_DETAILS = MONGO_CONNECTION_CONFIG.MONGO_ATLAS_CONNECTION;
            url = `mongodb+srv://${CONNECTION_DETAILS.user}:${CONNECTION_DETAILS.password}@${CONNECTION_DETAILS.host}/${CONNECTION_DETAILS.databaseName}?retryWrites=true&w=majority&appName=Cluster0`;
        } else {
            const CONNECTION_DETAILS = MONGO_CONNECTION_CONFIG.auth;
            url = `mongodb://${CONNECTION_DETAILS.user}:${CONNECTION_DETAILS.password}@${CONNECTION_DETAILS.host}:${CONNECTION_DETAILS.port}/?authSource=${CONNECTION_DETAILS.databaseName}&authMechanism=${CONNECTION_DETAILS.authMechanism}`;
        }

        dbClient = new MongoClient(url); // Use unified topology for better handling of replica sets and sharding.
        await dbClient.connect();
        console.log("===🎉🎉 CONNECTED TO MONGO DB 🎉🎉===");

        return dbClient.db();
    } catch (error) {
        console.error("❌ MONGO CONNECTION FAILED", error);
        throw error;
    }
};

class MongoDBManager {
    constructor() {
        this.db = null;
    }

    async init() {
        if (!this.db) {
            this.db = await connect();
        }
    }

    async find(collectionName, query = {}) {
        await this.init();
        const collection = this.db.collection(collectionName);
        return await collection.find(query).toArray();
    }

    async fetchById(collectionName, id) {
        await this.init();
        const collection = this.db.collection(collectionName);
        return await collection.findOne({ _id: new ObjectId(id) });
    }

    async insert(collectionName, data) {
        await this.init();
        const collection = this.db.collection(collectionName);
        const result = await collection.insertOne(data);
        return result.ops[0];
    }

    async update(collectionName, match, data) {
        await this.init();
        const collection = this.db.collection(collectionName);
        const result = await collection.updateOne(match, { $set: data });
        return result.modifiedCount > 0;
    }

    async delete(collectionName, id) {
        await this.init();
        const collection = this.db.collection(collectionName);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    }

    async getStatistics(scale=1){
        await this.init();
        return this.db.stats(scale)
    }
}

module.exports = {
    mongoClient: new MongoDBManager()
};
