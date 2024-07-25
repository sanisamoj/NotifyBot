import {Collection, Db, Document, MongoClient, WithId } from "mongodb"
import { CollectionsInDb } from "./CollectionsInDb"
import { Errors } from "../data/models/enums/Errors"
import * as dotenv from 'dotenv'

dotenv.config()

export class MongodbOperations {
    private uri: string = process.env.MONGO_HOST as string
    private mongodbName: string = process.env.MONGODB_NAME as string

    async register<DocumentType extends Document>(collectionName: CollectionsInDb, item : any): Promise<void> {
        const client: MongoClient = new MongoClient(this.uri)
        const db: Db = client.db(this.mongodbName)

        const collection: Collection<DocumentType> = db.collection(collectionName)
        await collection.insertOne(item)

        await client.close()
    }

    async delete<DocumentType extends Document>(collectionName: CollectionsInDb, query : any): Promise<void> {
        const client: MongoClient = new MongoClient(this.uri)
        const db: Db = client.db(this.mongodbName)

        const collection: Collection<DocumentType> = db.collection(collectionName)
        const deleteResult = await collection.deleteOne(query)
        if(deleteResult.deletedCount === 0) throw new Error(Errors.CouldNotDeleteItem)

        await client.close()
    }

    async return<DocumentType extends Document>(collectionName: CollectionsInDb, query : any): Promise<WithId<DocumentType> | null> {
        const client: MongoClient = new MongoClient(this.uri)
        const db: Db = client.db(this.mongodbName)

        const collection: Collection<DocumentType> = db.collection(collectionName)
        const result = await collection.findOne(query)

        await client.close()

        return result
    }

    async returnAll<DocumentType extends Document>(collectionName: CollectionsInDb): Promise<WithId<DocumentType>[]> {
        const client: MongoClient = new MongoClient(this.uri)
        const db: Db = client.db(this.mongodbName)
    
        try {
            const collection: Collection<DocumentType> = db.collection(collectionName)
            const cursor = collection.find()
    
            const allDocs: WithId<DocumentType>[] = []
            for await (const doc of cursor) {
                allDocs.push(doc)
            }
    
            return allDocs
        } finally {
            await client.close()
        }
    }

    async returnAllWithQuery<DocumentType extends Document>(collectionName: CollectionsInDb, query: any): Promise<WithId<DocumentType>[]> {
        const client: MongoClient = new MongoClient(this.uri)
        const db: Db = client.db(this.mongodbName)
    
        try {
            const collection: Collection<DocumentType> = db.collection(collectionName)
            const cursor = collection.find(query)
    
            const allDocs: WithId<DocumentType>[] = []
            for await (const doc of cursor) {
                allDocs.push(doc)
            }
    
            return allDocs
        } finally {
            await client.close()
        }
    }
    

    async update<DocumentType extends Document>(collectionName: string, filter: any, update: any): Promise<DocumentType> {
        const client: MongoClient = new MongoClient(this.uri)
        const db: Db = client.db(this.mongodbName)
        const collection: Collection<DocumentType> = db.collection(collectionName)

        const updateResult = await collection.findOneAndUpdate(filter, { $set: update }, { returnDocument: "after" })
        
        if (!updateResult) throw new Error(Errors.NoDocumentsMatchedQuery)
        
        await client.close()
        
        return updateResult.value
    }
    
}