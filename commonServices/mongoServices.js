const { MongoClient } = require('mongodb');
const  commonOperation  = require('./commonOperation');

const mongoConfig = commonOperation.readJsonFiles('applicationConfig/mongoConfig.json');
const auth = mongoConfig.auth;
// console.log('mongoConfig :', mongoConfig);

async function connectMongo(user, password, databaseName, authMechanism, port, host) {
    try {
        const uri = `mongodb://${user}:${password}@${host}:${port}/?authSource=${databaseName}&authMechanism=${authMechanism}`;
        const client = new MongoClient(uri);
        await client.connect();
        console.log("---->connected to mongo<-----");
        return client.db(databaseName);
    } catch (err) {
        console.error("error in mongo connection:", err);
        return null;
    }
}
let db;
async function connect() {
 db = await connectMongo(auth.user, auth.password, auth.databaseName, auth.authMechanism, auth.port, auth.host);
}
connect();
class MongoDBManager {
    constructor(database_name) {
        this.database_name = database_name;
    }

    getCollection(collection_name) {
        return db.collection(collection_name);
    }

    async insertDocument(collection_name, document) {
        // try {
            const collection = this.getCollection(collection_name);
            const result = await collection.insertOne(document);
            console.log(`Document inserted with ID: ${result.insertedId}`);
        // } catch (err) {
        //     console.error("Error in inserting document:", err);
        // }
    }
    async insertManyDocuments(collectionName, documents) {
        // try {
            const collection = this.getCollection(collectionName);
            const result = await collection.insertMany(documents);
            console.log(`Documents inserted with IDs: ${result.insertedIds}`);
        // } catch (err) {
        //     console.error("Error in inserting documents:", err);
        // }
    }

    async updateDocument(collectionName, filterQuery, updateData) {
        // try {
            console.log('collectionName--', collectionName, 'filterQuery', filterQuery, 'updateData', updateData);
            const collection = this.getCollection(collectionName);
            const result = await collection.updateOne(filterQuery, updateData);
            console.log(`Matched ${result.matchedCount} document(s) and modified ${result.modifiedCount} document(s)`);
        // } catch (err) {
        //     console.error("Error in updating document:", err);
        // }
    }

    async deleteDocument(collectionName, filterQuery) {
        // try {
            const collection = this.getCollection(collectionName);
            const result = await collection.deleteMany(filterQuery);
            console.log(`Deleted ${result.deletedCount} document(s)`);
        // } catch (err) {
        //     console.error("Error in deleting document:", err);
        // }
    }

    async findDocuments(collectionName, query = {}, projection = null) {
        // try {
            console.log('projection--', projection,'query--', query);
            const collection = this.getCollection(collectionName);
            const cursor =  collection.find(query).project(projection)
            const listCursor = await cursor.toArray();
            if (listCursor.length > 0) {
                return listCursor;
            } else {
                console.log("No documents found");
                return [];
            }
        // } catch (err) {
        //     console.error("Error in finding documents:", err);
        //     return [];
        // }
    }

    async aggregateDocuments(collectionName, pipeline, projection = null) {
        // try {
            const collection = this.getCollection(collectionName);
            if (projection) {
                pipeline.push({ $project: projection });
            }
            const result = await collection.aggregate(pipeline).toArray();
            return result;
        // } catch (err) {
        //     console.error("Error in aggregation:", err);
        //     return [];
        // }
    }

    // Implement other methods similarly
}

// const mongoDBManager = new MongoDBManager(auth.databaseName);
// Now you can use mongoDBManager to perform MongoDB operations
module.exports = MongoDBManager;

