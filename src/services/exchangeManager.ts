import { CronJob } from 'cron';
import { dbs } from '../commons/globals';
import { Transaction, Op } from 'sequelize';
import { ePubType } from '../commons/enums';
import { Today, Yesterday } from '../commons/utils';
import { logger } from '../commons/logger';


class ExchangeManager {
    private readonly job: CronJob

    constructor() {
        this.job = new CronJob('0 10 * * * *', async () => {
            logger.info(`exchange manager`.yellow)
            // await this.exchangePoints()
        }, null, false, 'Asia/Seoul');
    }

    start() {
        if ( this.job ) {
            this.job.start()
        }
        this.exchangePoints()
    }

    stop() {
        if ( this.job ) {
            this.job.stop()
        }
    }

    async exchangePoints() {
        await dbs.GeneratedPointsLog.getTransaction(async (transaction: Transaction) => {
            const today = Today();
            const logs = await dbs.GeneratedPointsLog.findAll({
                exchanged: false,
                created_at: {
                    [Op.lt]: today
                }
            }, transaction);

            for ( let i = 0; i < logs.length; i++ ) {
                const log = logs[i];
                switch ( log.pub_type ) {
                    case ePubType.GamePlay:
                        break;

                    default:
                        continue;
                }

                log.exchanged = true;
                await log.save({transaction})
            }
        })
    }
}


export default new ExchangeManager()
