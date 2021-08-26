import { Message } from 'kafka-node';
import { KafkaMessage } from 'kafkajs';

export interface IServerOptions {
    tcp: boolean,
    port: number,
    static_path?: Array<{path: string, route: string}>,
    ejs?: boolean,
    swagger?: boolean,
    graphql?: boolean,
    firebase?: boolean,
    rdb?: boolean,
    mdb?: boolean,
    messageQueue?: {
        groupId: string,
        autoCommit: boolean,
        // onMessage: (message: Message) => void,
        addTopics: string[],
    },
}

export interface IMessageQueueOptions {
    groupId: string,
    autoCommit: boolean,
    // onMessage: (message: Message) => void,
    addTopics?: string[],
    addGateways?: any,
    eachMessage: (topic: string, message: string ) => Promise<any>,
}
