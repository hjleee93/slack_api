import Model from '../../../_base/model';
import { DataTypes, Sequelize, Transaction } from 'sequelize';
import { dbs } from '../../../../commons/globals';
import { ePubType } from '../../../../commons/enums';

class UserPublishingModel extends Model {
    protected initialize(): void {
        this.name = 'userPublishing';
        this.attributes = {
            user_id:        { type: DataTypes.INTEGER, allowNull: false },
            game_id:        { type: DataTypes.INTEGER, allowNull: false },
            count_open:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            count_play:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            count_ad:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        }
    }

    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.User.model);
        this.model.belongsTo(dbs.Game.model);
    }


    async findAll({ user_id }: { user_id: number }, transaction?: Transaction) {

    }


    async updateCount({ user_id, game_id, pub_type }: { user_id: number, game_id: number, pub_type: ePubType }, transaction?: Transaction) {
        const { record, isNew } = await this.findOrCreate({
            user_id,
            game_id,
        }, undefined, transaction);

        let type = ''
        switch (pub_type) {
            case ePubType.GamePlay:
            case ePubType.PubGamePlay:
                type = 'play';
                break;

            case ePubType.AD:
                type = 'ad';
                break;
        }
        record[`count_${type}`] += 1;
        await record.save({ transaction });
    }
}

export default (rdb: Sequelize) => new UserPublishingModel(rdb)
