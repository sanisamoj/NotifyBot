import {Collection, Db, Document, MongoClient } from "mongodb"
import { CollectionsInDb } from "./CollectionsInDb"
import { Errors } from "../data/models/enums/Errors"
import * as dotenv from 'dotenv'

dotenv.config()

export class MongodbOperations {
    private uri: string = process.env.MONGO_HOST as string
    private mongodbName: string = process.env.MONGODB_NAME as string

    async register<DocumentType extends Document>(collectionName: CollectionsInDb, item : any) {
        const client: MongoClient = new MongoClient(this.uri)
        const db: Db = client.db(this.mongodbName)

        const collection: Collection<DocumentType> = db.collection(collectionName)
        await collection.insertOne(item)

        await client.close()
    }

    async delete<DocumentType extends Document>(collectionName: CollectionsInDb, query : any) {
        const client: MongoClient = new MongoClient(this.uri)
        const db: Db = client.db(this.mongodbName)

        const collection: Collection<DocumentType> = db.collection(collectionName)
        const deleteResult = await collection.deleteOne(query)
        if(deleteResult.deletedCount === 0) throw new Error(Errors.CouldNotDeleteItem)

        await client.close()
    }

    async return<DocumentType extends Document>(collectionName: CollectionsInDb, query : any) {
        const client: MongoClient = new MongoClient(this.uri)
        const db: Db = client.db(this.mongodbName)

        const collection: Collection<DocumentType> = db.collection(collectionName)
        const result = await collection.findOne(query)

        await client.close()

        return result
    }

    async returnAll<DocumentType extends Document>(collectionName: CollectionsInDb) {
        const client: MongoClient = new MongoClient(this.uri)
        const db: Db = client.db(this.mongodbName)

        const collection: Collection<DocumentType> = db.collection(collectionName)
        const cursor = await collection.find()

        let allDocs = []

        for await (const doc of cursor) {
            allDocs.push(doc)
        }

        await client.close()

        return allDocs
    }
}