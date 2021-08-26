import * as path from 'path';
import { capitalize, getFiles } from '../../commons/utils';
import { dbs } from '../../commons/globals';
import Model from './model';
import { Sequelize } from 'sequelize';
import { logger } from '../../commons/logger';
import { Options } from 'sequelize/types/lib/sequelize';


export interface IDbOption {
    database: string,
    username: string,
    password?: string,
    conn: Options,
}

class RDB {
    protected db?: Sequelize;

    async initialize (dbOpt: IDbOption) {
        this.db = new Sequelize(dbOpt.database, dbOpt.username, dbOpt.password, {
            ...dbOpt.conn,
            logging: msg => logger.debug(msg)
        });

        await this.db.authenticate();
        await this.syncDefine(dbOpt.conn?.dialect || 'mysql');

        logger.info(`${dbOpt.conn?.dialect} is ready.`.cyan)

        return this.db;
    }

    protected async syncDefine(dialect: string) {
        const models: any = {};
        const dir = path.join(__dirname, '..', dialect, '/models/');

        getFiles(dir, (dir: string, file: string) => {
            if ( !!this.db ) {
                // const model: any = this.db.import(path.join(dir, file));
                const model: any = require(path.join(dir, file)).default(this.db);
                models[capitalize(model.getName())] = model;
            }
        });

        if ( !!this.db ) {
            await this.db.sync();
        }

        // @ts-ignore
        dbs = Object.assign(dbs, models);

        for( const i in dbs) {
            if( dbs.hasOwnProperty(i) ) {
                const db = dbs[i];
                if( db instanceof Model ) {
                    await db.afterSync();
                }
            }
        }
    }
}


export default RDB
