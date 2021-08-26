import { dbs } from '../commons/globals';
import { CreateError, ErrorCodes } from '../commons/errorCodes';
import { eItemUsingType } from '../commons/enums';
import { Transaction } from 'sequelize';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;


interface IShopParams {
    item_id: number
}
class ShopController {
    async buyItem ({ item_id }: IShopParams, user: DecodedIdToken) {
        const item = await dbs.Item.findOne({ item_id });
        if ( !item ) {
            throw CreateError(ErrorCodes.INVALID_ITEM_ID);
        }

        const userRecord = await dbs.User.findOne({ uid: user.uid });
        const user_id = userRecord.id;
        await dbs.Inventory.getTransaction(async (transaction: Transaction) => {
            // 구입 가능한지 확인
            // 중복 확인
            if ( item.used_type !== eItemUsingType.Accumulated ) {
                const _have_it = await dbs.Inventory.findOne({ user_id, item_id });
                if ( _have_it ) {
                    throw CreateError(ErrorCodes.BUY_DUPLICATED_ITEM)
                }
            }

            // 돈 있나 확인

            // 구매 - 포인트 차감

            // 구매 - 인벤토리에 추가
            await dbs.Inventory.create({ user_id, item_id }, transaction);
        })
    }


    async useItem({ item_id }: IShopParams, user: DecodedIdToken) {
        const userRecord = await dbs.User.findOne({ uid: user.uid });
        const user_id = userRecord.id;
        await dbs.Inventory.getTransaction(async (transaction: Transaction) => {
            const item = await dbs.Inventory.findOne({ user_id, item_id });
            if ( item.is_used ) {
                throw CreateError(ErrorCodes.REJECT_USE_ITEM);
            }
        })
    }
}


export default new ShopController()
