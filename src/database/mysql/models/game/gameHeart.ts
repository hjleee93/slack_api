import Model from '../../../_base/model';
import { DataTypes, Sequelize, Transaction } from 'sequelize';
import { parseBoolean } from '../../../../commons/utils';


class GameHeartModel extends Model {
    protected initialize(): void {
        this.name = 'gameHeart';
        this.attributes = {
            game_id:    { type: DataTypes.INTEGER, allowNull: false, unique: 'compositeIndex' },
            user_uid:   { type: DataTypes.STRING, allowNull: false, unique: 'compositeIndex' },
            activated:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        }
    }


    likeIt = async (game_id: number, user_uid: string, activated: any) => {
        let changed = false;
        return await this.getTransaction(async (transaction: Transaction) => {
            const record = await this.findOne({ game_id, user_uid }, transaction);
            if ( record ) {
                if ( record.activated !== parseBoolean(activated)  ) {
                    record.activated = activated;
                    await record.save({ transaction });
                    changed = true;
                }
            }
            else {
                await this.create({ game_id, user_uid, activated: true });
                changed = true;
            }
            return changed;
        })
    }
}


export default (rdb: Sequelize) => new GameHeartModel(rdb)
