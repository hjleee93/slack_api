import Model from '../../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { eReplyReaction } from '../../../../commons/enums';


class UserGameReplyReactionModel extends Model {
    protected initialize(): void {
        this.name = 'userGameReplyReaction';
        this.attributes = {
            reply_id:       { type: DataTypes.INTEGER, allowNull: false, unique: 'compositeIndex' },
            user_uid:       { type: DataTypes.STRING(36), allowNull: false, unique: 'compositeIndex' },
            reaction:       { type: DataTypes.SMALLINT, allowNull: false, defaultValue: eReplyReaction.none },
        }
    }

}


export default (rdb: Sequelize) => new UserGameReplyReactionModel(rdb)
