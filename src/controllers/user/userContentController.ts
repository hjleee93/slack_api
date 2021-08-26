import * as _ from 'lodash';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;
import { dbs } from '../../commons/globals';
import { Transaction } from 'sequelize';


class UserContentController {
    getMailbox = async ({ limit = 50, offset = 0 }: any, user: DecodedIdToken) => {
        const mails = await dbs.UserMailbox.getMails({ user_uid: user.uid, hide: false, limit, offset });
        return {
            mails: _.map(mails, (mail: any) => {
                return {
                    id: mail.id,
                    is_read: mail.is_read,
                    category: mail.category,
                    title: mail.title,
                    created_at: mail.created_at,
                }
            })
        }
    }


    readMail = async ({ id }: { id: number }, user: DecodedIdToken) => {
        return await dbs.UserMailbox.getTransaction(async (transaction: Transaction) => {
            const mail = await dbs.UserMailbox.findOne({ user_uid: user.uid, id, hide: false }, transaction);
            mail.is_read = true;
            await mail.save({ transaction });

            return {
                content: mail.content,
            }
        })
    }


    deleteMail = async ({ mail_id }: { mail_id: number }, user: DecodedIdToken) => {
        await dbs.UserMailbox.update({ hide: true }, { user_uid: user.uid, id: mail_id});
    }
}


export default new UserContentController()

