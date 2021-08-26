import Model from '../../_base/model';
import { DataTypes, Sequelize, Op } from 'sequelize';
import { dbs } from '../../../commons/globals';


/**
 * 플랫폼 서비스 공지 사항
 */

const samples: any = [
    {category: 0, title: '공지사항1', content: '내용내용1\ntype = stable', img_link: 'https://t1.daumcdn.net/brunch/service/user/2D9/image/YITANAAcA-ylT5Rd8fsE4mgI7_0.jpg', start_at: '2020-05-19 16:40:47', end_at: '2021-05-21 16:40:55'},
    {category: 1, title: '공지사항2', content: '내용내용2\ntype = once', img_link: 'https://img1.daumcdn.net/thumb/R720x0/?fname=http://t1.daumcdn.net/news/201412/06/seoul/20141206171705476.jpeg', start_at: '2020-05-19 16:40:47', end_at: '2021-05-21 16:40:55'},
    {category: 2, title: '공지사항3', content: '내용내용3\ntype = event', img_link: 'https://img.animalplanet.co.kr/news/2020/02/19/700/1365a2q9p47avck7n98j.jpg', start_at: '2020-05-19 16:40:47', end_at: '2021-05-21 16:40:55'},
];
class NoticeModel extends Model {
    protected initialize() {
        this.name = 'notice';
        this.attributes = {
            category:       { type: DataTypes.SMALLINT, allowNull: false },
            activated:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            title:          { type: DataTypes.STRING(100), allowNull: false },
            content:        { type: DataTypes.STRING(500), allowNull: false },
            img_link:       { type: DataTypes.STRING(500) },
            start_at:       { type: DataTypes.DATE, allowNull: false },
            end_at:         { type: DataTypes.DATE, allowNull: false },
        };
    }

    async afterSync(): Promise<void> {
        if (await this.model.count() < 1) {
            await this.bulkCreate(samples);
        }
    }

    async getList({ date }: {date: Date}) {
        return await this.model.findAll({
            where: {
                start_at: {
                    [Op.lte]: date,
                },
                end_at: {
                    [Op.gte]: date,
                }
            },
            attributes: {
                exclude: ['id', 'deleted_at', 'updated_at']
            }
        })
    }

}

export default (rdb: Sequelize) => new NoticeModel(rdb);
