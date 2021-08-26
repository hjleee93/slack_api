const MYSQL = require('mysql2');
import RDB, { IDbOption } from '../_base/rdb';
import db_options from '../../../config/dbs';
const mysqlOpt = db_options.mysql;


class MySql extends RDB {
    async initialize (dbOpt: IDbOption, charSet = 'utf8', collate = 'utf8_general_ci') {
        const connection = await MYSQL.createConnection({
            host:       dbOpt.conn.host,
            port:       dbOpt.conn.port,
            user:       dbOpt.username,
            password:   dbOpt.password,
        } as any);

        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${mysqlOpt.database} CHARACTER SET ${charSet} COLLATE ${collate};`);

        return super.initialize(dbOpt);

        // try {
            // const connection = await MYSQL.createConnection({
            //     host:       mysqlOpt.conn.host,
            //     port:       mysqlOpt.conn.port,
            //     user:       mysqlOpt.username,
            //     password:   mysqlOpt.password,
            // } as any);
            //
            // await connection.execute(`CREATE DATABASE IF NOT EXISTS ${mysqlOpt.database} CHARACTER SET utf8 COLLATE utf8_general_ci;`);
            //
            // this.db = new Sequelize(mysqlOpt.database, mysqlOpt.username, mysqlOpt.password, {
            //     ...mysqlOpt.conn,
            //     logging: msg => logger.debug(msg)
            // });
            //
            // await this.db.authenticate();
            // await this.syncDefine();
            // logger.info('mysql is ready.'.cyan)
            //
            // return this.db;
        // }
        // catch (e) {
        //     console.error(e.stack);
        // }
    }
    //
    //
    // private async syncDefine() {
    //     const models: any = {};
    //     const dir = path.join(__dirname, '/models/');
    //
    //     getFiles(dir, (dir: string, file: string) => {
    //         if ( !!this.db ) {
    //             // const model: any = this.db.import(path.join(dir, file));
    //             const model: any = require(path.join(dir, file)).default(this.db);
    //             models[capitalize(model.getName())] = model;
    //         }
    //     });
    //
    //     if ( !!this.db ) {
    //         await this.db.sync();
    //     }
    //
    //     // @ts-ignore
    //     dbs = Object.assign(dbs, models);
    //
    //     for( const i in dbs) {
    //         if( dbs.hasOwnProperty(i) ) {
    //             const db = dbs[i];
    //             if( db instanceof Model ) {
    //                 await db.afterSync();
    //             }
    //         }
    //     }
    // }

}


export default new MySql();
