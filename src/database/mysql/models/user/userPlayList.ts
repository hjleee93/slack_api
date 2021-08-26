import { DataTypes, Sequelize } from 'sequelize';
import Model from '../../../_base/model';
import { dbs } from '../../../../commons/globals';


class UserPlaylistModel extends Model {
    protected initialize(): void {
        this.name = 'userPlaylist';
        this.attributes = {
            uid:            { type: DataTypes.STRING(36), allowNull: false },
            user_uid:       { type: DataTypes.STRING(36), allowNull: false },

            limit:          { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 5 },

            title:          { type: DataTypes.STRING(100), allowNull: false },
            url_bg:         { type: DataTypes.STRING(250) },

            indexes:        { type: DataTypes.JSON },

            count_visited:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.User.model, { foreignKey: 'user_uid', targetKey: 'uid' });
        this.model.hasMany(dbs.UserPlaylistGame.model, { as: 'games' });
    }

    async getPlaylist({ uid }: { uid: string }) {
        const record = await this.model.findOne({
            where: { uid },
            include: [{
                model: dbs.User.model,
            }, {
                model: dbs.UserPlaylistGame.model,
                as: 'games',
                include: [{
                    model: dbs.Game.model,
                    include: [{
                        model: dbs.User.model,
                    }]
                }]
            }]
        });
        return record.get({ plain: true });
    }
}


export default (rdb: Sequelize) => new UserPlaylistModel(rdb)
