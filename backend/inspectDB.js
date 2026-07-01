const { MongoClient } = require('mongodb');
require('dotenv').config();

const getDatabaseName = (uri) => {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace(/^\//, '');
    return dbName || 'RecipesDB';
};

const redactUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, '//<username>:<password>@');

const inspectDatabase = async (uri) => {
    const client = new MongoClient(uri);

    try {
        console.log('Connecting to:', redactUri(uri));
        await client.connect();

        const db = client.db(getDatabaseName(uri));
        const collections = await db.listCollections().toArray();

        console.log('\n--- Database Summary ---');
        console.log(`Database Name: ${db.databaseName}`);

        if (collections.length === 0) {
            console.log('No collections found.');
            return;
        }

        for (const coll of collections) {
            const count = await db.collection(coll.name).countDocuments();
            console.log(`- ${coll.name}: ${count} documents`);
        }
    } finally {
        await client.close();
    }
};

const migrateLocalToAtlas = async () => {
    const sourceUri = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/RecipesDB';
    const targetUri = process.env.MONGODB_URI;

    if (!targetUri) {
        throw new Error('MONGODB_URI must be set before running migration.');
    }

    const sourceClient = new MongoClient(sourceUri);
    const targetClient = new MongoClient(targetUri);

    try {
        console.log('Source:', redactUri(sourceUri));
        console.log('Target:', redactUri(targetUri));

        await sourceClient.connect();
        await targetClient.connect();

        const sourceDb = sourceClient.db(getDatabaseName(sourceUri));
        const targetDb = targetClient.db(getDatabaseName(targetUri));
        const collections = await sourceDb.listCollections().toArray();

        if (collections.length === 0) {
            console.log('No local collections found to migrate.');
            return;
        }

        for (const coll of collections) {
            const sourceCollection = sourceDb.collection(coll.name);
            const targetCollection = targetDb.collection(coll.name);
            const documents = await sourceCollection.find({}).toArray();

            if (documents.length === 0) {
                console.log(`- ${coll.name}: skipped, no documents`);
                continue;
            }

            await targetCollection.bulkWrite(
                documents.map((document) => ({
                    replaceOne: {
                        filter: { _id: document._id },
                        replacement: document,
                        upsert: true
                    }
                })),
                { ordered: false }
            );
            console.log(`- ${coll.name}: upserted ${documents.length} documents`);
        }

        console.log('\nMigration complete. Atlas database summary:');
        await inspectDatabase(targetUri);
    } finally {
        await sourceClient.close();
        await targetClient.close();
    }
};

const main = async () => {
    const shouldMigrate = process.argv.includes('--migrate');
    const uri = process.env.MONGODB_URI;

    if (shouldMigrate) {
        await migrateLocalToAtlas();
        return;
    }

    if (!uri) {
        throw new Error('MONGODB_URI must be set before inspecting the database.');
    }

    await inspectDatabase(uri);
};

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Database script failed:', err.message);
        process.exit(1);
    });
