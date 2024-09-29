const { MongoClient, ObjectId } = require("mongodb");
const commonOperation = require('../commonServices/commonOperation'); // Ensure this is correctly required

const mongoConfig = commonOperation.readJsonFiles('./src/config/mongoConfig.json');
const MONGO_CONNECTION_CONFIG = mongoConfig;

const connect = async () => {
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
        // console.log("🔗 CONNECTION STRING:", url);s
        const client = new MongoClient(url);
        await client.connect();
        console.log("===🎉🎉 CONNECTED TO MONGO DB 🎉🎉===");
        return client.db(); // Store the database instance
    } catch (error) {
        console.error("❌ MONGO CONNECTION FAILED", error);
        throw error; // Rethrow to handle connection issues
    }
};

let db;
(async () => {
    db = await connect(MONGO_CONNECTION_CONFIG);
})();

class MongoDBManager {
    constructor() {
        db = null;
    }


    async fetch(collectionName, query = {}, { }) {
        // console.log("Fetch",db);
        // await this.init();
        // console.log(db);

        const collection = db.collection(collectionName);
        return await collection.find(query).toArray();
    }

    async fetchById(collectionName, id) {
        const collection = db.collection(collectionName);
        return await collection.findOne({ _id: new ObjectId(id) });
    }

    async insert(collectionName, data) {
        const collection = db.collection(collectionName);
        const result = await collection.insertOne(data);
        return result.ops[0];
    }

    async update(collectionName, match, data) {
        const collection = db.collection(collectionName);
        const result = await collection.updateOne(
            match,
            { $set: data }
        );
        return result.modifiedCount > 0;
    }

    async delete(collectionName, id) {
        const collection = db.collection(collectionName);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    }
}


module.exports = {
    mongoClient: new MongoDBManager()
}


