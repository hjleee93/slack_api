import * as _ from 'lodash';
import Model from '../../../_base/model';
import { dbs } from '../../../../commons/globals';
import { DataTypes, Sequelize } from 'sequelize';


export enum EAdminTask {
    login,
    logout,
    admin_add,
    admin_mod,
    admin_del,
    admin_list,
}

class AdminLogModel extends Model {
    protected initialize(): void {
        this.name = 'adminLog';
        this.attributes = {
            admin_id:       { type: DataTypes.INTEGER, allowNull: false },
            path:           { type: DataTypes.STRING(50), allowNull: false },
            body:           { type: DataTypes.STRING(500) },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.Admin.model)
    }


    async getLogs({ admin_id, limit = 50, offset = 0, sort = 'id', dir = 'asc' }: any) {
        const where: any = {};
        if ( admin_id ) where.admin_id = admin_id;
        return this.model.findAndCountAll({
            where,
            include: [{
                model: dbs.Admin.model,
            }],
            order: [[sort, dir]],
            limit: _.toNumber(limit),
            offset: _.toNumber(offset),
        })
    }
}


export default (rdb: Sequelize) => new AdminLogModel(rdb)
