import * as _ from 'lodash';
import Model from '../../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { eMailCategory } from '../../../../commons/enums';


class UserMailboxModel extends Model {
    protected initialize(): void {
        this.name = 'userMailbox';
        this.attributes = {
            user_uid:       { type: DataTypes.STRING(36), allowNull: false },
            is_read:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            category:       { type: DataTypes.SMALLINT, allowNull: false, defaultValue: eMailCategory.Normal },
            title:          { type: DataTypes.STRING(100), allowNull: false },
            content:        { type: DataTypes.STRING(500), allowNull: false },
            hide:           { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        }
    }


    async afterSync(): Promise<void> {
        await super.afterSync();

        const desc = await this.model.sequelize.queryInterface.describeTable(this.model.tableName);
        if ( !desc['category'] ) {
            this.model.sequelize.queryInterface.addColumn(this.model.tableName, 'category', {
                type: DataTypes.SMALLINT,
                allowNull: false,
                defaultValue: eMailCategory.Normal,
                after: 'is_read'
            })
        }
    }


    getMails = async ({ user_uid, hide = false, limit = 50, offset = 0 }: any) => {
        return await this.model.findAll({
            where: { user_uid, hide },
            // attributes: {
            //     exclude: ['created_at', 'updated_at', 'deleted_at'],
            // },
            order: [['created_at', 'desc']],
            limit: _.toNumber(limit),
            offset: _.toNumber(offset),
        })
    }
}


export default (rdb: Sequelize) => new UserMailboxModel(rdb)
