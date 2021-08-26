import Model from '../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { dbs } from '../../../commons/globals';


class InventoryModel extends Model {
    protected initialize(): void {
        this.name = 'inventory';
        this.attributes = {
            user_id:        { type: DataTypes.INTEGER, allowNull: false },
            item_id:        { type: DataTypes.INTEGER, allowNull: false },
        }
    }


    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.User.model);
        this.model.belongsTo(dbs.Item.model);
    }


    async getUserInventory({ user_id }: { user_id: number}) {
        return this.model.findAll({
            where: {
                user_id,
            },
            include: [{
                model: dbs.Item.model,
                attributes: {
                    exclude: ['created_at', 'updated_at', 'deleted_at'],
                },
            }]
        })
    }
}


export default (rdb: Sequelize) => new InventoryModel(rdb)
