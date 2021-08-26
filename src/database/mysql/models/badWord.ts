import * as _ from 'lodash';
import * as path from 'path';
import Model from '../../_base/model';
import { DataTypes, Op,Sequelize } from 'sequelize';
import XlsxLoader from '../../../services/xlsxLoader';


class BadWordModel extends Model {
    private filters: any = [];

    protected initialize(): void {
        this.name = 'badWords';
        this.attributes = {
            activated:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            word:       { type: DataTypes.STRING(50), allowNull: false },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        if ( await this.model.count() < 1 ) {
            const filename = path.join(__dirname, '../../../../../xlsx/badwords.xlsx');
            const { sheetNames, sheets, colNames } = XlsxLoader.readFile(filename);

            this.filters = [];
            for ( let i = 0; i < sheetNames.length; i++ ) {
                const name = sheetNames[i];
                const data = sheets[name];
                const filtered = _.filter(data, obj => !!obj[0]);
                const bulk: any = _.map(filtered, (obj: any) => {
                    this.filters.push(obj[0]);
                    return {
                        word: obj[0],
                    }
                });
                await this.bulkCreate(bulk);
            }
        }
        else {
            const records = await this.findAll({activated: true});
            this.filters = _.map(records, (record: any) => record.word);
        }
    }

    isOk (str: string) {
        return !_.some(this.filters, (word: string) => str.toLowerCase().includes(word));
    }

    areOk (obj: object) {
        return !_.some(this.filters, (word: string) => {
            return _.some(obj, (str: any) => {
                return typeof str === 'string' && str.toLowerCase().includes(word);
            })
        })
    }
}


export default (rdb: Sequelize) => new BadWordModel(rdb)
