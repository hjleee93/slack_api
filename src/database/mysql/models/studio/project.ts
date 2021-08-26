import Model from '../../../_base/model';
import { DataTypes, Op, Sequelize, Transaction } from 'sequelize';
import { dbs } from '../../../../commons/globals';
import { eProjectState } from '../../../../commons/enums';


class ProjectModel extends Model {
    protected initialize() {
        this.name = 'project';
        this.attributes = {
            user_id:            { type: DataTypes.INTEGER, allowNull: false },
            name:               { type: DataTypes.STRING(50), allowNull: true },
            state:              { type: DataTypes.SMALLINT, allowNull: false, defaultValue: eProjectState.Normal },
            picture:            { type: DataTypes.STRING(250), allowNull: true },
            picture2:           { type: DataTypes.STRING(250), allowNull: true },
            picture_webp:       { type: DataTypes.STRING(250), allowNull: true },
            control_type:       { type: DataTypes.SMALLINT, defaultValue: 0 },
            description:        { type: DataTypes.STRING(2000), defaultValue: '' },
            hashtags:           { type: DataTypes.STRING, defaultValue: '' },
            game_id:            { type: DataTypes.INTEGER, allowNull: true },
            deploy_version_id:  { type: DataTypes.INTEGER, allowNull: true },
            update_version_id:  { type: DataTypes.INTEGER, allowNull: true },
            stage:              { type: DataTypes.INTEGER, allowNull: false},
        }
    }

    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.User.model);
        this.model.belongsTo( dbs.Game.model );

        this.model.hasMany(dbs.ProjectVersion.model);
        this.model.hasOne(dbs.ProjectVersion.model, { sourceKey : 'deploy_version_id'});
        this.model.hasOne(dbs.ProjectVersion.model, { sourceKey : 'update_version_id'});

        const desc = await this.model.sequelize.queryInterface.describeTable(this.model.tableName);

        if ( !desc['hashtags'] ) {
            this.model.sequelize.queryInterface.addColumn(this.model.tableName, 'hashtags', {
                type: DataTypes.STRING(),
                defaultValue: '',
                after: 'description'
            })
        }

        if ( !desc['picture_webp'] ) {
            this.model.sequelize.queryInterface.addColumn(this.model.tableName, 'picture_webp', {
                type: DataTypes.STRING(250),
                defaultValue: '',
                after: 'picture'
            })
        }

        if ( !desc['picture2'] ) {
            this.model.sequelize.queryInterface.addColumn(this.model.tableName, 'picture2', {
                type: DataTypes.STRING(250),
                allowNull: true,
                after: 'picture_webp'
            })
        }

        if ( !desc['state'] ) {
            this.model.sequelize.queryInterface.addColumn(this.model.tableName, 'state', {
                type: DataTypes.SMALLINT,
                allowNull: false,
                defaultValue: eProjectState.Normal,
                after: 'name'
            })
        }

        // 컬럼추가
        if ( !desc['stage'] ) {
            this.model.sequelize.queryInterface.addColumn(this.model.tableName, 'stage', {
                type: DataTypes.INTEGER,
                allowNull: false,
                after: 'update_version_id'
            })
        }

    }

    async create({ user_id, name, description, picture, picture_webp, picture2, hashtags, stage } : any, transaction?: Transaction) {
        const value : any = {
            user_id,
            name,
            description,
            hashtags,
        }

        if( picture ) {
            value.picture = picture;
        }

        if( picture_webp ) {
            value.picture_webp = picture_webp;
        }

        if( picture2 ) {
            value.picture2 = picture2;
        }

        if( stage ) {
            value.stage = stage;
        }

        return super.create( value, transaction );
    }

    async getProjects({ user_id } : any, transaction?: Transaction) {
        return this.model.findAll( {
            where: { user_id },
            include: [{
                model: dbs.Game.model,
            },{
                model: dbs.ProjectVersion.model,
            }],
            transaction
        });

    }

    async getProject({ id } : any, transaction?: Transaction) {
        return this.model.findOne( {
            where: { id },
            include: [{
                model: dbs.Game.model,
            },{
                model: dbs.ProjectVersion.model,
            }],
            transaction
        });
    }

    async updateProject({ id, name, picture, picture2, picture_webp, control_type, description, hashtags, game_id, deploy_version_id, update_version_id, stage } : any, transaction?: Transaction) {
        const project = await this.findOne( { id }, transaction );

        if( name ) {
            project.name = name;
        }

        if( picture ) {
            project.picture = picture;
        }

        if( picture2 ) {
            project.picture2 = picture2;
        }

        if( picture_webp ) {
            project.picture_webp = picture_webp;
        }

        if( control_type ) {
            project.control_type = control_type;
        }

        if( description ) {
            project.description = description;
        }

        if( game_id ) {
            project.game_id = game_id;
        }

        if( hashtags ) {
            project.hashtags = hashtags;
        }

        if( deploy_version_id || deploy_version_id === null ) {
            project.deploy_version_id = deploy_version_id;
        }

        if( update_version_id || update_version_id === null) {
            project.update_version_id = update_version_id;
        }

        if( stage ) {
            project.stage = stage;
        }

        return await project.save( { transaction } );
    }

    async delete() {

    }
}

export default (rdb: Sequelize) => new ProjectModel(rdb);
