import * as kafka from 'kafka-node';
import { CreateTopicResponse, Message } from 'kafka-node';
import topics from './kafkaTopics';
import { logger } from '../commons/logger';


namespace KafkaService {
    export class Producer {
        private producer!: kafka.Producer;
        private options = {
            requireAcks: 1,
            ackTimeoutMs: 100,
            partitionerType: 0
        };

        connect() {
            return new Promise((resolve, reject) => {
                try {
                    if ( this.producer ) {
                        return resolve(this.producer);
                    }
                    const client = new kafka.KafkaClient();
                    client.createTopics(topics, (error: any, result: CreateTopicResponse[]) => {
                        this.producer = new kafka.Producer(client, this.options);
                        this.producer.on('ready', () => { resolve(this.producer)});
                        this.producer.on('error', this.onError);
                        // resolve(this.producer);
                    })
                }
                catch (e) {
                    reject(e);
                }
            })
        }

        onError(error: any) {
            throw new Error(error)
        }

        send(payloads: kafka.ProduceRequest[]) {
            this.producer.send(payloads, (err: any, data: any) => {
                if ( err ) {
                    return logger.error(err)
                }

                // logger.debug(data)
                console.log('[kafka-produce]', data)
            })
        }
    }

    export class Consumer {
        private consumer!: kafka.Consumer;

        connect(groupId?: string, autoCommit = false, onMessage = this.onMessage) {
            return new Promise((resolve, reject) => {
                try {
                    if ( this.consumer ) {
                        return resolve(this.consumer);
                    }
                    const options = {
                        groupId,
                        autoCommit
                    }
                    this.consumer = new kafka.Consumer(new kafka.KafkaClient(), [], options)
                    this.consumer.on('error', this.onError.bind(this))
                    this.consumer.on('message', onMessage);

                    resolve(this.consumer);
                }
                catch(e) {
                    reject(e)
                }
            })
        }

        onError(error: any) {
            throw new Error(error)
        }

        addTopic(topics: string[]) {
            this.consumer.addTopics(topics, (error: any, added: string[]) => {
                if ( error ) {
                    return console.error(error)
                }
                console.log(`added Topic: `, added)
            })
        }

        onMessage(message: Message) {}
    }
}

export const Producer = new KafkaService.Producer()
export const Consumer = new KafkaService.Consumer()
