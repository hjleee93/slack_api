"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    Server: {
        http: {
            port: 8280,
        },
        ws: {
            port: 8280,
        },
        Secure: {
            https: false,
            port: 8289,
            // options: {
            //     key: fs.readFileSync('key.pem'),
            //     cert: fs.readFileSync('cert.pem')
            // },
        },
        studio: {
            port: 8281,
        },
        admin: {
            port: 8299,
        },
    },
    Url: {
        Host: 'http://gtest.fromthered.com:8280',
        DeployApiV1: 'http://gtest.fromthered.com:8288/api/v1',
        GameClient: 'http://localhost:8080/play',
        Redirect: 'http://localhost:8280/redirect',
        Launcher: 'http://gtest.fromthered.com/zempie/launcher',
        LauncherRedirect: 'http://gtest.fromthered.com/zempie/launcher/redirect',
    },
    Deploy: {
        url_v1: 'http://gtest.fromthered.com:8288/api/v1',
        api_key: 'xdo1lbgkc5xmxn2'
    },
    AWS: {
        Bucket: {
            Rsc: 'dev-zempie/v1',
            RscPublic: 'dev-zempie/v1',
            Static: 'dev-zempie/static',
        }
    },
    password: {
        salt: '@#FE)UFIOWJF)@#J',
        iteration: 100000
    },
    JWT: {
        access: {
            secret: 'ASDF#%Y^Y$U%@$I1f',
            options: {
                algorithm: 'HS256',
                expiresIn: '7d',
                issuer: 'from the red',
            }
        },
        refresh: {
            secret: '*I^H%$HG%#!@GF#%GH@',
            options: {
                algorithm: 'HS256',
                expiresIn: '30d',
                issuer: 'from the red'
            },
        }
    },
    CORS: {
        allowedOrigin: [
            'http://www.zempie.com', 'https://www.zempie.com',
            'http://launcher.zempie.com', 'https://launcher.zempie.com',
            'http://studio.zempie.com', 'https://studio.zempie.com',
            'http://support.zempie.com', 'https://support.zempie.com',
            'http://admin.zempie.com', 'https://admin.zempie.com',
        ],
        secure: false,
        domain: '.zempie.com',
    },
    Kafka: {
        clientId: 'zempie',
        brokers: ['localhost:9092']
    },
};
//# sourceMappingURL=staging.js.map