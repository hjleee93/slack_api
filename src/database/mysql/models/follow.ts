import Model from '../../_base/model';
import { DataTypes, Sequelize, Transaction, Op } from 'sequelize';
import { dbs } from '../../../commons/globals';
import { CreateError, ErrorCodes } from '../../../commons/errorCodes';


/**
 * follower, following
 */

class FollowModel extends Model {
    protected initialize() {
        this.name = 'follow';
        this.attributes = {
            user_uid:   { type: DataTypes.STRING(36), allowNull: false },
            target_uid: { type: DataTypes.STRING(36), allowNull: false },
        };
    }

    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.User.model, { foreignKey: 'user_uid', targetKey: 'uid', as: 'user' });
        this.model.belongsTo(dbs.User.model, { foreignKey: 'target_uid', targetKey: 'uid', as: 'target' });
        // this.model.belongsTo(dbs.UserGame.model, { foreignKey: 'target_id', targetKey: 'user_id', as: 'gameRecord' });
    }


    async follow({user_uid, target_uid}: any, transaction?: Transaction) {
        const record = await this.findOne({ user_uid, target_uid }, transaction);
        if ( record ) {
            throw CreateError(ErrorCodes.ALREADY_FOLLOWING_TARGET);
        }

        await this.create({ user_uid, target_uid }, transaction);
    }

    async unFollow({ user_uid, target_uid }: any, transaction?: Transaction) {
        await this.destroy({ user_uid, target_uid }, transaction);
    }


    async following({user_uid}: any, transaction?: Transaction) {
        return this.model.findAll({
            where: {
                user_uid: {
                    [Op.eq]: user_uid,
                },
                target_uid: {
                    [Op.ne]: user_uid,
                }
            },
            include: [{
                model: dbs.User.model,
                as: 'target',
                required: true,
            }],
            transaction
        });
    }

    async followers({user_uid}: any, transaction?: Transaction) {
        return this.model.findAll({
            where: {
                target_uid: {
                    [Op.eq]: user_uid,
                },
                user_uid: {
                    [Op.ne]: user_uid,
                },
            },
            include: [{
                model: dbs.User.model,
                as: 'user',
                required: true,
            }],
            transaction
        })
    }
}

export default (rdb: Sequelize) => new FollowModel(rdb);
