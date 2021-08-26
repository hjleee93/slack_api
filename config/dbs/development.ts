export default {
    mysql: {
        database: 'zempie',
        username: 'dev',
        password: 'ftred103',
        conn: {
            host: 'mysql',
            port: 3306,
            dialect: 'mysql',
            pool: {
                max: 5,
                min: 0,
                idle: 10000
            },
            // operatorsAliases: {},
            dialectOptions: {
                multipleStatements: true
            },
            // underscored: true
            define: {
                underscored: true,
                freezeTableName: false,
                createdAt: "created_at",
                updatedAt: "updated_at",
                deletedAt: "deleted_at"
            }
        },
    },
    redis: {
        host: 'mysql',
        port: 6379,
        family: 4,
        password: 'ftred103',
        db: 0,
    }
}
