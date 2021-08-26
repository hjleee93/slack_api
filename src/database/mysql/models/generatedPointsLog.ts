import Model from '../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { dbs } from '../../../commons/globals';
import { ePubType } from '../../../commons/enums';


interface IPublishingParams {
    user_id: string,
    game_id: string,
    pub_type: ePubType
}

class GeneratedPointsLogModel extends Model {
    protected initialize(): void {
        this.name = 'generatedPointsLog';
        this.attributes = {
            user_id:    { type: DataTypes.INTEGER, allowNull: false },
            game_id:    { type: DataTypes.INTEGER, allowNull: false },
            pub_type:   { type: DataTypes.SMALLINT, allowNull: false, defaultValue: ePubType.GamePlay },
            exchanged:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        }
    }


    async createPoints({ user_id, game_id, pub_type }: IPublishingParams) {
        return this.create({
            user_id,
            game_id,
            pub_type,
        });
    }

}


export default (rdb: Sequelize) => new GeneratedPointsLogModel(rdb)
