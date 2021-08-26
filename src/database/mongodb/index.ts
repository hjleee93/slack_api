import * as _ from 'lodash';
import * as path from 'path';
import { Db, MongoClient } from 'mongodb';
import * as mongoose from 'mongoose';
import { docs, dbs } from '../../commons/globals';
import { capitalize, getFiles } from '../../commons/utils';


// const host = 'mongodb://localhost:27017/test';
const host = `mongodb://DESKTOP-G5BA1K1:27017,DESKTOP-G5BA1K1:27018,DESKTOP-G5BA1K1:27019/test?replicaSet=rs&retryWrites=false`
const database = 'zempie';




class MongoDB {
    // private db: Db | undefined;
    private client!: MongoClient;
    private db!: mongoose.Connection;

    public async initialize() {
        const options = {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true,
            retryWrites: false,
        };
        // this.client = await MongoClient.connect(host, options);
        // this.db = this.client.db(database);
        // await this.syncDefine();

        await mongoose.connect(host, options);
        this.db = mongoose.connection;
        this.db.on('error', console.error.bind(console, 'mongodb connection error:'));
        this.db.once('open', async () => {
            console.log('!!?')
        })
        await this.syncDefine();


        // await this.migration(this.db);
    }

    private async syncDefine() {
        // const collections: any = {};
        const dir = path.join(__dirname, '/models');

        getFiles(dir, (dir: string, file: string) => {
            if ( !!this.db ) {
                // const collection: any = require(path.join(dir, file)).default(this.db, this.client);
                const collection: any = require(path.join(dir, file)).default;
                docs[capitalize(collection.getName())] = collection;
            }
        })
    }

    private async migration (db: Db) {
        // for ( const i in docs ) {
        //     if ( docs.hasOwnProperty(i) ) {
        //         const collection = docs[i];
        //         if ( collection instanceof _collection ) {
        //             await collection.afterSync();
        //         }
        //     }
        // }
        //
        // let users = await dbs.User.model.findAll({
        //     include: [{
        //         model: dbs.UserProfile.model,
        //         as: 'profile',
        //     }]
        // });
        // const arr = _.map(users, (r: any) => {
        //     const obj = r.get({ plain: true });
        //     const { profile, gameRecords, devGames } = obj;
        //     return {
        //         uid: obj.uid,
        //         activated: obj.activated,
        //         banned: obj.banned,
        //         name: obj.name,
        //         channel_id: obj.channel_id,
        //         picture: obj.picture,
        //         provider: obj.provider,
        //         email: obj.email,
        //         email_verified: obj.email_verified,
        //         fcm_token: obj.fcm_token,
        //         is_developer: obj.is_developer,
        //         last_log_in: obj.last_log_in,
        //         profile: {
        //             level: profile.level,
        //             state_msg: profile.state_msg,
        //             description: profile.description,
        //             url_banner: profile.url_banner,
        //         },
        //     }
        // })
        // await docs.User2.bulkCreate(arr);
        // await docs.User2.destroy({ uid: 'e3ritamdc0REBTzgaGzi8rqCYQa2' });
        // const res = await docs.User2.findAll({ deleted_at: null });
        // console.log(res.length);
    }
}


export default new MongoDB()
