import * as moment from "moment-timezone";
import * as _ from "lodash";

class TimeManager {

    timeList(duration:number, businessTime:any[]){

        let endTime = moment(businessTime[1], 'HH:mm').subtract(duration, 'm')
        let tempTime = moment(businessTime[0], 'HH:mm');

        let timeList: any[] = [businessTime[0]];

        //15분 기준으로 예약 가능
        while (tempTime < endTime) {
            timeList.push(tempTime.add(15, 'm').format('HH:mm'))
        }

        const result = _.map(timeList, (time: any, idx: number) => {
            return {
                "text": {
                    "type": "plain_text",
                    "text": `${time} - ${moment(time, 'HH:mm').add(duration, 'm').format('HH:mm')}`,
                    "emoji": true
                },
                "value": `${time}-${moment(time, 'HH:mm').add(duration, 'm').format('HH:mm')}`
            }
        })

        return result;

    }
}


export default new TimeManager()