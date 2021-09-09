import * as moment from "moment-timezone";
import * as _ from "lodash";
import blockManager from "./blockManager";
import {dbs} from "../commons/globals";

class TimeManager {

    async timeList(duration: number, businessTime: any[], date: any, room_number: string) {

        let closeTime = moment(businessTime[1], 'HH:mm').subtract(duration, 'm')
        let startTime = moment(businessTime[0], 'HH:mm');
        let timeList: any[] = [businessTime[0]];
        let result: any[] = [];

        // if(tempTime <  moment('19:00', 'HH:mm') && date !== moment().format('yyyy-DD')) {

        //15분 기준으로 예약 가능 closeTime
        while (startTime < closeTime) {
            timeList.push(startTime.add(15, 'm').format('HH:mm'))
        }

        result = _.map(timeList, (time: any) => {
            let endTime = moment(time, 'HH:mm').add(duration, 'm');

            // if (endTime <= startTime){
            return {
                "text": {
                    "type": "plain_text",
                    "text": `${time} - ${endTime.format('HH:mm')}`,
                    "emoji": true
                },
                "value": `${time}-${endTime.format('HH:mm')}`
            }


        })

        const checkTime = await this.checkDupTime(result, room_number, new Date(date))

        return result[0] ? checkTime : blockManager.noAbleTime()

    }

    async checkDupTime(originList: any[], room_number: string, selectedDate: Date) {

        const result = await dbs.Meeting.hasMeetingOnDate(selectedDate, room_number)

        let startIdx: number | undefined;
        let endIdx: number | undefined;

        _.some(result, (meeting: any) => {
            _.some(originList, (list: any, i: number) => {

                if (list.value.split('-')[0] === meeting.start) {
                    if (!startIdx) {
                        startIdx = i;
                    }
                }
                if (list.value.split('-')[1] === meeting.start) {
                    if (!startIdx) {
                        startIdx = i + 1;
                    }
                }
                if (list.value.split('-')[0] === meeting.end) {
                    endIdx = i;
                    // return true;
                }
                if (list.value.split('-')[1] === meeting.end) {
                    endIdx = originList.length;
                    // return true;
                }
            })

            if ((startIdx || startIdx === 0) && endIdx) {
                originList.splice(startIdx, endIdx - startIdx);

            }else if(!startIdx && endIdx ){
                originList.splice(0, endIdx);
            }
            startIdx = undefined;
            endIdx = undefined;
        })


        return originList;
    }
}


export default new TimeManager()