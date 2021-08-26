import * as _ from 'lodash';
import Model from '../../../_base/model';
import { DataTypes, Sequelize, Op } from 'sequelize';
import { dbs } from '../../../../commons/globals';


interface IUserInquiryParams {
    user_id: number
    title?: string
    content?: string
    no_answer?: any
    sort: string,
    dir: string,
    limit: number
    offset: number
}

class UserInquiryModel extends Model {
    protected initialize(): void {
        this.name = 'userInquiry';
        this.attributes = {
            user_id:    { type: DataTypes.INTEGER, allowNull: false },
            category:   { type: DataTypes.SMALLINT, allowNull: false },
            title:      { type: DataTypes.STRING(100), allowNull: false },
            text:       { type: DataTypes.STRING(500), allowNull: false },
            response:   { type: DataTypes.STRING(500) },
            admin_id:   { type: DataTypes.INTEGER },
            url_img:    { type: DataTypes.STRING },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.User.model);
        this.model.belongsTo(dbs.Admin.model);


        const desc = await this.model.sequelize.queryInterface.describeTable(this.model.tableName);
        if ( !desc.url_img ) {
            await this.model.sequelize.queryInterface.addColumn(this.model.tableName, 'url_img', {
                type: DataTypes.STRING,
                after: 'admin_id'
            })
        }
    }

    async getList({ user_id, no_answer, limit = 50, offset = 0, sort = 'id', dir = 'asc' }: IUserInquiryParams) {
        const where: any = {};
        if ( user_id ) {
            where.user_id = user_id;
        }
        if ( no_answer === 'true' || no_answer === '1' ) {
            where.answer = {
                [Op.eq]: null
            }
        }
        const { count, rows } = await this.findAndCountAll(where, {
            include: [{
                model: dbs.User.model,
                required: true,
            }, {
                model: dbs.Admin.model,
            }],
            order: [[sort, dir]],
            limit: _.toNumber(limit),
            offset: _.toNumber(offset),
        });

        return {
            count,
            inquiries: _.map(rows, (r: any) => {
                return {
                    id: r.id,
                    category: r.category,
                    title: r.title,
                    text: r.text,
                    url_img: r.url_img,
                    response: r.response,
                    asked_at: r.created_at,
                    responded_at: r.updated_at,
                    user: {
                        id: r.user.id,
                        uid: r.user.uid,
                        name: r.user.name,
                        picture: r.user.picture,
                    },
                    admin: {
                        name: r.admin? r.admin.name : undefined,
                    }
                }
            })
        }

    }


}


export default (rdb: Sequelize) => new UserInquiryModel(rdb)
