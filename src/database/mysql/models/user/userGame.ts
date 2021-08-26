import * as _ from 'lodash';
import Model from '../../../_base/model';
import { DataTypes, Sequelize, Transaction } from 'sequelize';
import { dbs } from '../../../../commons/globals';


/**
 * 플랫폼 서비스 내에서 발생하는 사용자의 게임 정보
 * 최고 점수 기록
 */

class UserGameModel extends Model {
    protected initialize() {
        this.name = 'userGame';
        this.attributes = {
            user_uid:       { type: DataTypes.STRING(36), allowNull: false, unique: 'compositeIndex' },
            // game_uid:       { type: DataTypes.STRING(36), allowNull: false, unique: 'compositeIndex' },
            game_id:        { type: DataTypes.INTEGER, allowNull: false, unique: 'compositeIndex' },
            score:          { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        };
    }


    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.User.model, { foreignKey: 'user_uid', targetKey: 'uid' });
        this.model.belongsTo(dbs.Game.model, { foreignKey: 'game_id', targetKey: 'id' });
        // this.model.belongsTo(dbs.Follow.model, { foreignKey: 'user_uid', target: 'target_uid' });

        const desc = await this.model.sequelize.queryInterface.describeTable(this.model.tableName);
        if ( !desc.game_id ) {
            await this.model.sequelize.queryInterface.addColumn(this.model.tableName, 'game_id', {
                type: DataTypes.INTEGER,
                // allowNull: false,
                // unique: 'compositeIndex',
                after: 'user_uid'
            })
        }

        // await this.getTransaction(async (transaction: Transaction) => {
        //     const records = await this.model.findAll({
        //         where: {},
        //         transaction,
        //     })
        //
        //     if ( records[0].game_id === null ) {
        //         const _games = await dbs.Game.findAll({});
        //         const games = _.map(_games, game => game.get({plain: true}))
        //
        //         for ( let i = 0; i < records.length; i++ ) {
        //             const userGame = records[i];
        //             const game = _.find(games, game => game.uid === userGame.game_uid);
        //             userGame.game_id = game.id;
        //             await userGame.save({ transaction });
        //         }
        //     }
        // })
    }



}

export default (rdb: Sequelize) => new UserGameModel(rdb);
