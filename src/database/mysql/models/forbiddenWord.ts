import * as _ from 'lodash';
import Model from '../../_base/model';
import { DataTypes, Op, Sequelize } from 'sequelize';

class ForbiddenWord extends Model {
    private filters: any = [];

    protected initialize(): void {
        this.name = 'forbiddenWords';
        this.attributes = {
            activated:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            word:       { type: DataTypes.STRING(50), allowNull: false }
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        const records = await this.findAll({activated: true});
        this.filters = _.map(records, (record: any) => record.word);
    }

    isOk (str: string) {
        return !_.some(this.filters, (word: string) => str.toLowerCase().includes(word));
    }

    areOk (obj: object) {
        return !_.some(this.filters, (word: string) => {
            return _.some(obj, (str: any) => {
                return typeof str === 'string' && str.toLocaleLowerCase().includes(word);
            })
        })
    }
}


export default (rdb: Sequelize) => new ForbiddenWord(rdb);
