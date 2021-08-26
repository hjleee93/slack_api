import { CronJob } from 'cron';


class ScheduleService {
    private job: CronJob;

    constructor() {
        this.job = new CronJob('0 * * * *', () => {
            console.log(`cron 스케쥴러 on ${new Date().getSeconds()}`.yellow);
        }, null, false, 'Asia/Seoul');
    }

    start = () => {
        if ( this.job ) {
            this.job.start()
        }
    }
}

export default new ScheduleService()
