import Model from '../../../_base/model';
import { DataTypes, Sequelize, Transaction } from 'sequelize';
import { dbs } from '../../../../commons/globals';
import { CreateError, ErrorCodes } from '../../../../commons/errorCodes';


class GameChallengingReportModel extends Model {
    protected initialize(): void {
        this.name = 'gameChallengingReport';
        this.attributes = {
            user_uid:       { type: DataTypes.STRING(36), allowNull: false, unique: 'compositeIndex' },
            game_id:        { type: DataTypes.INTEGER, allowNull: false, unique: 'compositeIndex' },
            rating:         { type: DataTypes.SMALLINT, allowNull: false },
            comment:        { type: DataTypes.STRING(250) },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.User.model, { foreignKey: 'user_uid', targetKey: 'uid' });
        this.model.belongsTo(dbs.Game.model);
    }

    async create({ user_uid, game_id, rating, comment }: any, transaction?: Transaction) {
        if ( rating < 1 || rating > 5 ) {
            throw CreateError(ErrorCodes.INVALID_PARAMS);
        }

        return super.create({ user_uid, game_id, rating, comment }, transaction);
    }
}


export default (rdb: Sequelize) => new GameChallengingReportModel(rdb)
