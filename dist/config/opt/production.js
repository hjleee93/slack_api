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
        content: {
            port: 8283,
        }
    },
    Url: {
        Host: 'https://zempie.com',
        GameClient: 'http://zempie.com/play',
        Redirect: 'https://zempie.com/redirect',
        Launcher: 'https://launcher.zempie.com',
        LauncherRedirect: 'https://launcher.zempie.com/redirect',
    },
    AWS: {
        // Bucket: 'zempie-rsc/v1',
        Bucket: {
            Rsc: 'zempie-rsc/v1',
            RscPublic: 'zempie-rsc-pb/v1',
            Static: 'zempie-rsc/static',
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
            'http://zempie.com', 'https://zempie.com',
            'http://launcher.zempie.com', 'https://launcher.zempie.com',
            'http://studio.zempie.com', 'https://studio.zempie.com',
            'http://support.zempie.com', 'https://support.zempie.com',
            'http://admin.zempie.com', 'https://admin.zempie.com',
            'https://script.google.com',
        ],
        secure: false,
        domain: '.zempie.com',
    },
    Kafka: {
        clientId: 'zempie',
        brokers: [
            'localhost:9092',
            // 'b-1.zempie-cluster-1.61ghlz.c4.kafka.ap-northeast-2.amazonaws.com:9092',
            // 'b-2.zempie-cluster-1.61ghlz.c4.kafka.ap-northeast-2.amazonaws.com:9092'
        ]
    },
};
//# sourceMappingURL=production.js.map