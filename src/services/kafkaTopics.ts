import { CreateTopicRequest } from 'kafka-node';

const configEntries = [
    {
        name: 'compression.type',
        value: 'gzip',
    }
]

const topics: CreateTopicRequest[] = [
    {
        topic: 'gameOver',
        partitions: 1,
        replicationFactor: 1,
        configEntries,
    },
    {
        topic: 'pub_PlayGame',
        partitions: 1,
        replicationFactor: 1,
        configEntries,
    },
    {
        topic: 'battle_gameOver',
        partitions: 1,
        replicationFactor: 1,
        configEntries,
    }
]

export default topics
