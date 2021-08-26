import * as swaggerJSDoc from 'swagger-jsdoc'

const swaggerDefinition = {
    // swagger: '2.0',
    openapi: '3.0.3',
    info: {
        title: 'Zempie APIs',
        version: '1.0.0',
        description: '이거슨 쩸파이 API들이닷',
        termsOfService: 'termsOfService',
        contact: {
            email: 'jw.park@fromthered.com',
        },
        license: {
            name: 'Apache 2.0',
            url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
        },
    },
    externalDocs: {
        description: '이메일 로그인하러 가기',
        url: 'http://localhost:3000'
    },
    servers: [
        {
            url: 'http://localhost:8280/api/v1',
            description: 'localhost'
        },
        {
            url: 'http://192.168.0.10:8280/api/v1',
            description: '테스트 서버'
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        responses: {
            Okay: {
                description: '오퀘이'
            },
            UnauthorizedError: {
                description: 'Firebase 토큰 오류'
            }
        }
    },
    // host: 'localhost:8280',
    // basePath: '/api/v1',
    // // basePath: '/',
    // schemes: ['http', 'https'],
    // securityDefinitions: {
    //     token: {
    //         type: 'apiKey',
    //         in: 'header',
    //         name: 'Authorization',
    //     },
    //     // 'Firebase idToken': {
    //     //     type: 'apiKey',
    //     //     name: 'Authorization',
    //     //     in: 'header'
    //     // },
    //     // petstore_auth: {
    //     //     type: 'oauth2',
    //     //     authorizationUrl: 'http://',
    //     //     flow: 'implicit',
    //     //     scopes: {
    //     //         'write:pets': "modify pets in your account",
    //     //         'read:pets': "read your pets"
    //     //     }
    //     // }
    // },

};

const options = {
    swaggerDefinition,
    apis: [ './swagger/*.yaml' ]
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec
