import { DataTypes, Sequelize, Transaction } from 'sequelize';
import Model from '../../../_base/model';
import { dbs } from '../../../../commons/globals';


class UserPlaylistGameModel extends Model {
    protected initialize(): void {
        this.name = 'userPlaylistGame';
        this.attributes = {
            user_playlist_id:   { type: DataTypes.INTEGER, allowNull: false, unique: 'compositeIndex' },
            game_id:            { type: DataTypes.INTEGER, allowNull: false, unique: 'compositeIndex' },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.Game.model);
    }


}


export default (rdb: Sequelize) => new UserPlaylistGameModel(rdb)
