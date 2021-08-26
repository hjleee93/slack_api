import Model from '../../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { dbs } from '../../../../commons/globals';
import { signJWT, verifyJWT } from '../../../../commons/utils';
import { CreateError, ErrorCodes } from '../../../../commons/errorCodes';

class AdminRefreshTokenModel extends Model {
    protected initialize(): void {
        this.name = 'adminRefreshToken';
        this.attributes = {
            admin_id:       { type: DataTypes.INTEGER, allowNull: false },
            token:          { type: DataTypes.STRING(300), allowNull: false },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();
        this.model.belongsTo(dbs.Admin.model);
    }

    async refresh(token: string) {
        const decoded = verifyJWT(token);
        const { id, name, level } = decoded;
        const record = await this.findOne({admin_id: id, token})
        if ( !record ) {
            throw CreateError(ErrorCodes.INVALID_ADMIN_REFRESH_TOKEN)
        }

        return signJWT({
            name,
            level,
        }, '30d');
    }
}


export default (rdb: Sequelize) => new AdminRefreshTokenModel(rdb)
