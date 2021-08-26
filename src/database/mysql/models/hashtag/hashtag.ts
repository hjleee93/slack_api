import Model from '../../../_base/model';
import { DataTypes, Op, Sequelize, Transaction } from 'sequelize';
import { dbs } from '../../../../commons/globals';
import * as _ from 'lodash';
import { getGameData } from '../../../../controllers/_common';

class HashtagModel extends Model {
    protected initialize(): void {
        this.name = 'hashtag';
        this.attributes = {
            fixed:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            name:   { type: DataTypes.STRING(50), allowNull: false, unique: true },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.hasMany(dbs.RefTag.model, { sourceKey: 'id', foreignKey: 'tag_id' });

        try {
            if ( await this.model.count() < 1 ) {
                let games = await dbs.Game.findAll({});
                games = _.map(games, game => game.get({ plain: true }));
                for( let i = 0; i < games.length; i++ ) {
                    const game = games[i];
                    if ( game.id === 65 || game.id === 82) {
                        console.log(game);
                    }
                    if ( game.hashtags.length > 0 ) {
                        await this.addTags(game.id, game.hashtags);
                    }
                }
            }
        }
        catch (e) {
            console.error(e);
        }
    }


    private processAddTags = async (game_id: number, hashtags: string, transaction?: Transaction) => {
        hashtags = hashtags.replace(/\s|,/gi, '#');
        const tags = _.union(_.map(_.filter(hashtags.split('#'), tag => tag !== ''), tag => tag.trim()))
        const dup = await dbs.Hashtag.findAll({
            name: {
                [Op.in]: tags
            }
        });

        const newTags = _.difference(tags, _.map(dup, d => d.name));
        const bulkTag: any = _.map(newTags, tag => {
            return {
                fixed: false,
                name: tag,
            }
        });
        const records = await this.bulkCreate(bulkTag, {
            transaction,
            updateOnDuplicate: ['name'],
            // returning: true,
            individualHooks: true
        });

        // ref_hash
        const newRef = _.union([..._.map(dup, r => r.id), ..._.map(records, r => r.id)]);
        const bulkRef: any = _.map(newRef, tag_id => {
            return {
                ref_id: game_id,
                ref_type: 'game',
                tag_id: tag_id,
            }
        });
        await dbs.RefTag.bulkCreate(bulkRef, { transaction });
    }
    addTags = async (game_id: number, hashtags: string, transaction?: Transaction) => {
        return this.processAddTags(game_id, hashtags, transaction);
        // if ( transaction ) {
        //     return this.processAddTags(game_id, hashtags, transaction);
        // }
        // return await this.getTransaction(async (transaction: Transaction) => {
        //     return this.processAddTags(game_id, hashtags, transaction);
        // })
    }


    async delTags(ref_id: number, tag: string, transaction?: Transaction) {
        await dbs.RefTag.destroy({ref_id}, transaction);
    }


    async getTagsLike(tag: string) {
        const records = await this.model.findAll({
            where: {
                name: {
                    [Op.like]: `${tag}%`
                }
            },
        });
        return _.map(records, record => record.get({ plain: true }))
    }
    async getGamesById(id: number, {limit = 50, offset= 0}) {
        const record = await this.model.findOne({
            where: { id },
            include: [{
                model: dbs.RefTag.model,
                include: [{
                    model: dbs.Game.model,
                    include: [{
                        model: dbs.User.model,
                        where: {
                            activated: true,
                            banned: false,
                            deleted_at: null,
                        },
                        required: true,
                    }]
                }],
                limit: _.toNumber(limit),
                offset: _.toNumber(offset),
            }]
        });
        return record?.get({ plain: true })
    }


    async getGamesByTag(tag: string, { limit = 50, offset = 0 }) {
        const record = await this.model.findOne({
            where: { name: tag },
            include: [{
                model: dbs.RefTag.model,
                include: [{
                    model: dbs.Game.model,
                    order: [['count_over', 'desc'], ['count_heart', 'desc']],
                }]
            }],
            limit: _.toNumber(limit),
            offset: _.toNumber(offset),
        });

        return record?.get({ plain: true })
    }

    async getGamesByTagLike(tag: string) {
        const record = await this.model.findOne({
            where: {
                name: {
                    [Op.like]: `${tag}%`
                }
            },
            include: [{
                model: dbs.RefTag.model,
                include: [{
                    model: dbs.Game.model,
                }]
            }]
        });

        return record?.get({ plain: true })
    }
}


export default (rdb: Sequelize) => new HashtagModel(rdb)
