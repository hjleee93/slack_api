import { v4 as uuid } from 'uuid';
import Model from '../../../_base/model';
import { Sequelize, DataTypes } from 'sequelize';
import { makePassword } from '../../../../commons/utils';


class AdminModel extends Model {
    protected initialize() {
        this.name = 'admin';
        this.attributes = {
            uid:            { type: DataTypes.UUID, allowNull: false },
            activated:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            account:        { type: DataTypes.STRING(20), unique: true, allowNull: false },
            name:           { type: DataTypes.STRING(20), allowNull: false },
            level:          { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 1 },
            sub_level:      { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
            password:       { type: DataTypes.STRING(250), allowNull: false },
        };
    }

    async afterSync(): Promise<void> {
        if ( await this.model.count() < 1 ) {
            const password = makePassword('administrator');
            await this.model.create({
                uid: uuid(),
                account: 'master',
                password,
                name: 'master',
                level: 10,
            });
        }
    }

}

export default (rdb: Sequelize) => new AdminModel(rdb);
