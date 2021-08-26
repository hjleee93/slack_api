import { DataTypes, Op, Sequelize } from 'sequelize';
import Model from '../../_base/model';


class SurveyModel extends Model {
    protected initialize(): void {
        this.name = 'survey';
        this.attributes = {
            activated:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            form_id:    { type: DataTypes.STRING(100), allowNull: false },
            form_url:   { type: DataTypes.STRING(200), allowNull: false },
            start_at:   { type: DataTypes.DATE, allowNull: false },
            end_at:     { type: DataTypes.DATE, allowNull: false },
        }
    }


    currentSurvey = async () => {
        const record = await this.model.findOne({
            where: {
                activated: true,
                start_at: {
                    [Op.lte]: new Date(),
                },
                end_at: {
                    [Op.gte]: new Date(),
                },
            },
            order: [['end_at', 'desc']]
        });
        return record?.get({ plain: true });
    }
}


export default (rdb: Sequelize) => new SurveyModel(rdb)
