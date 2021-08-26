import Model from '../../../_base/model';
import {DataTypes, Sequelize, Transaction} from 'sequelize';
import {dbs} from '../../../../commons/globals';

class ParticipantModel extends Model {
    protected initialize(): void {
        this.name = 'participant'
        this.attributes = {
            user_id: {type: DataTypes.STRING, allowNull: false},
            booking_id: {type: DataTypes.INTEGER, allowNull: false}
        }
    }

    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.Booking.model, {foreignKey: 'booking_id', targetKey: 'id'});
    }


    async get({battle_uid}: { battle_uid: string }, transaction?: Transaction) {
        const record = await this.model.findOne({
            where: {
                uid: battle_uid,
            },
            include: [{
                model: dbs.User.model,
                attributes: ['uid', 'name', 'picture'],
            }, {
                model: dbs.Game.model,
                attributes: ['uid', 'pathname', 'title', 'version', 'control_type', 'url_game', 'url_thumb', 'url_thumb_webp', 'url_thumb_gif']
            }]
        });

        return record.get({plain: true});
    }


    async getInfo(uid: string) {
        const record = await this.model.findOne({
            where: {uid},
            attributes: {
                exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
            },
            include: [{
                model: dbs.User.model,
                as: 'host',
                attributes: {
                    exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
                },
            }, {
                model: dbs.Game.model,
                attributes: {
                    exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
                },
                include: [{
                    model: dbs.User.model,
                    attributes: {
                        exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
                    },
                    required: true,
                }],
            }]
        })

        return record.get({plain: true})
    }
}


export default (rdb: Sequelize) => new ParticipantModel(rdb);
