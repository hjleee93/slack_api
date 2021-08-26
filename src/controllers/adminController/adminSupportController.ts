import { dbs } from '../../commons/globals';
import { IAdmin, INoticeParams, IRoute } from '../_interfaces';
import * as _ from 'lodash';
import { Transaction } from 'sequelize';
import { CreateError, ErrorCodes } from '../../commons/errorCodes';
import FileManager from '../../services/fileManager';
import Opt from '../../../config/opt';
const replaceExt = require('replace-ext');


/**
 * 고객지원
 */
class AdminSupportController {
    async getUserInquiry ({ id }: any) {
        const inquiry = await dbs.UserInquiry.model.findOne({
            where: { id },
            include: [{
                model: dbs.User.model,
            }, {
                model: dbs.Admin.model,
            }]
        });
        return {
            inquiry: {
                id: inquiry.id,
                category: inquiry.category,
                title: inquiry.title,
                text: inquiry.text,
                url_img: inquiry.url_img,
                response: inquiry.response,
                created_at: inquiry.created_at,
                updated_at: inquiry.updated_at,
                user: {
                    id: inquiry.user.id,
                    uid: inquiry.user.uid,
                    name: inquiry.user.name,
                    picture: inquiry.user.picture,
                },
                admin: {
                    name: inquiry.admin? inquiry.admin.name : undefined,
                }
            }
        }
    }

    async getUserInquiries({ user_id, no_answer, limit = 50, offset = 0, sort = 'id', dir = 'asc' }: any) {
        return await dbs.UserInquiry.getList({ user_id, no_answer, limit, offset, sort, dir });
    }

    async respondInquiry({ id, response }: any, admin: IAdmin) {
        const inquiry = await dbs.UserInquiry.findOne({ id });
        if ( inquiry.response ) {
            // 어쩔까?
        }

        inquiry.response = response;
        inquiry.admin_id = admin.id;
        inquiry.save();

    }


    async getNotices({ limit = 50, offset = 0, sort = 'id', dir = 'asc' }) {
        const { count, rows } = await dbs.Notice.findAndCountAll({}, {
            order: [[sort, dir]],
            limit: _.toNumber(limit),
            offset: _.toNumber(offset),
        })

        return {
            count,
            notices: _.map(rows, n => n.get({plain: true}))
        }
    }


    async createNotice({category, title, content, img_link, start_at, end_at}: INoticeParams) {
        await dbs.Notice.create({ category, title, content, img_link, start_at, end_at })
    }


    async updateNotice({id, category, title, content, img_link, start_at, end_at}: INoticeParams) {
        return dbs.Notice.getTransaction(async (transaction: Transaction) => {
            const notice = await dbs.Notice.findOne({id}, transaction);
            if( !notice ) {
                throw CreateError(ErrorCodes.INVALID_NOTICE_ID);
            }

            // 수정수정
            category? notice.category = category : null;
            title? notice.title = title : null;
            content? notice.content = content : null;
            img_link? notice.img_link = img_link : null;
            start_at? notice.start_at = new Date(start_at) : null;
            end_at? notice.end_at = new Date(end_at) : null;

            await notice.save({transaction});
        })
    }


    async deleteNotice({id}: INoticeParams) {
        return dbs.Notice.getTransaction(async (transaction: Transaction) => {
            const notice = await dbs.Notice.findOne({id}, transaction);
            if( !notice ) {
                throw CreateError(ErrorCodes.INVALID_NOTICE_ID);
            }

            await notice.destroy({ transaction });
        })
    }


    /**
     * FAQ
     */
    async createFAQ({ category, q, a }: any, admin: IAdmin, {req: {files: {file}}}: IRoute) {
        await dbs.Faq.getTransaction(async (transaction: Transaction) => {
            const record = await dbs.Faq.create({ category, q, a }, transaction);
            if ( file ) {
                const webp = await FileManager.convertToWebp(file, 80);
                const data: any = await FileManager.s3upload({
                    bucket: Opt.AWS.Bucket.Static,
                    key: replaceExt(`${category}_${record.id}`, '.webp'),
                    filePath: webp[0].destinationPath,
                    uid: '',
                    subDir: '/support/faq',
                });
                record.url_img = data.Location;
                await record.save({ transaction });
            }
        })
    }
}


export default new AdminSupportController()
