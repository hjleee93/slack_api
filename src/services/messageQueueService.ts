import * as _ from 'lodash';
import { CompressionTypes, Consumer, Kafka, logLevel, Message, Producer, ProducerRecord } from 'kafkajs'
import config from '../../config/opt';


class KafkaService {
    private _isRunning: boolean = false;
    private producer?: Producer
    private consumer?: Consumer
    private gateways: any = {};

    async initialize (groupId: string) {
        const kafka = new Kafka({
            clientId: config.Kafka.clientId,
            brokers: config.Kafka.brokers,
            logLevel: logLevel.ERROR,
            retry: {
                // initialRetryTime: 100,
                // retries: 0,
            }
        });

        this.producer = kafka.producer();
        this.consumer = kafka.consumer({ groupId });

        try {
            await this.producer.connect();
            await this.consumer.connect();
            // await this.consumer.subscribe({ topic: 'test-topic', fromBeginning: true })

            this._isRunning = true;
        }
        catch(e) {
            console.error(e);
            this.producer = undefined;
            this.consumer = undefined;
        }
    }

    get isRunning () { return this._isRunning }

    async addTopics (topics: Array<string>) {
        _.forEach(topics, async (topic: string) => {
            if ( this.consumer ) {
                await this.consumer.subscribe({
                    topic,
                    fromBeginning: true
                })
            }
        })
    }

    async addGateways (gateways: any) {
        _.forEach(gateways, async (obj: any) => {
            if ( this.isRunning && this.consumer ) {
                await this.consumer.subscribe({
                    topic: obj.topic,
                    fromBeginning: true
                })
            }
            else {
                this.gateways[obj.topic] = obj.func;
            }
        })
    }

    async run (eachMessage: any) {
        if ( this.consumer ) {
            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    if ( message && message.value ) {
                        eachMessage(topic, message.value.toString())
                    }
                }
            })
        }
    }

    async send (payloads: {topic: string, messages: Message[]}) {
        if ( this.isRunning && this.producer ) {
            return this.producer.send({
                ...payloads,
                compression: CompressionTypes.GZIP
            })
        }
        else {
            _.forEach(payloads.messages, (message: Message) => {
                this.gateways[payloads.topic](message.value);
            })
        }
    }
}


export default new KafkaService()
