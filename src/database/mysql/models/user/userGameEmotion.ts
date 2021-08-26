import { DataTypes, Sequelize, Transaction } from 'sequelize';
import Model from '../../../_base/model';
import { parseBoolean } from '../../../../commons/utils';


class UserGameEmotionModel extends Model {
    protected initialize(): void {
        this.name = 'userGameEmotion';
        this.attributes = {
            user_uid:   { type: DataTypes.STRING(36), allowNull: false, unique: 'compositeIndex' },
            game_id:    { type: DataTypes.INTEGER, allowNull: false, unique: 'compositeIndex' },
            emotion:    { type: DataTypes.STRING(4), allowNull: false, unique: 'compositeIndex' },
            activated:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        }
    }


    feelLike = async (game_id: number, user_uid: string, emotion: string, activated: boolean) => {
        let changed = false;
        return await this.getTransaction(async (transaction: Transaction) => {
            const record = await this.findOne({ game_id, user_uid, emotion }, transaction);
            if ( record ) {
                if ( record.activated !== parseBoolean(activated) ) {
                    record.activated = activated;
                    await record.save({ transaction });
                    changed = true;
                }
            }
            else {
                await this.create({ game_id, user_uid, emotion, activated: true });
                changed = true;
            }
            return changed;
        })
    }
}


export default (rdb: Sequelize) => new UserGameEmotionModel(rdb)
