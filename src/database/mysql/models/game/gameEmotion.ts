import Model from '../../../_base/model';
import { DataTypes, Sequelize, Transaction } from 'sequelize';


class GameEmotionModel extends Model {
    protected initialize(): void {
        this.name = 'gameEmotion';
        this.attributes = {
            game_id:    { type: DataTypes.INTEGER, allowNull: false },
            e1:         { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            e2:         { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            e3:         { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            e4:         { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            e5:         { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        }
    }



}


export default (rdb: Sequelize) => new GameEmotionModel(rdb)
