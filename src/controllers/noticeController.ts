import { dbs } from "../commons/globals";
import { INoticeParams } from "./_interfaces";
import { CreateError, ErrorCodes } from "../commons/errorCodes";
import { Transaction } from "sequelize";

class NoticeController {
    async getList() {
        const notices = await dbs.Notice.getList({ date: new Date() });
        return {
            notices: notices.map((notice: any) => {
                return notice.get({plain: true})
            })
        }
    }


    // async create({type, title, content, img_link, start_at, end_at}: INoticeParams) {
    //     await dbs.Notice.create({
    //         type,
    //         title,
    //         content,
    //         img_link,
    //         start_at,
    //         end_at
    //     })
    // }
    //
    //
    // async delete({id}: INoticeParams) {
    //     return dbs.Notice.getTransaction(async (transaction: Transaction) => {
    //         const notice = await dbs.Notice.findOne({id}, transaction);
    //         if( !notice ) {
    //             throw CreateError(ErrorCodes.INVALID_NOTICE_ID);
    //         }
    //
    //         await notice.destroy({ transaction });
    //     })
    // }
    //
    //
    // async update({id}: INoticeParams) {
    //     return dbs.Notice.getTransaction(async (transaction: Transaction) => {
    //         const notice = await dbs.Notice.findOne({id}, transaction);
    //         if( !notice ) {
    //             throw CreateError(ErrorCodes.INVALID_NOTICE_ID);
    //         }
    //
    //         // 수정수정
    //
    //         await notice.save({transaction});
    //     })
    // }
}

export default new NoticeController()
