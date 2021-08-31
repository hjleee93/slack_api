import * as _ from "lodash";

class viewController {

    private baseTime: any[] = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    private availTime: any[] = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

    setStartTime(timeList?: any[]) {
        const blocks: any[] = [];
        this.availTime = timeList ? this.startTime(timeList): this.baseTime


        for (let i = 0; i < this.availTime.length; i++) {
            blocks.push({
                "text": {
                    "type": "plain_text",
                    "text": `${this.availTime[i]}:00`,
                    "emoji": true
                },
                "value": `${this.availTime[i]}`
            })
        }
        return blocks
    }

    setEndTime(startTime?: number, endTimeArr?: any[]) {
        const blocks: any[] = [];
        let endTimeList =  endTimeArr? endTimeArr:this.availTime;

        if(startTime) {
            const index = endTimeList.findIndex(elem => {
                return elem == startTime;
            });
            if(index !== -1){
                endTimeList = endTimeList.slice(index);
            }
        }


        for (let i = 1; i < endTimeList.length; i++) {
            blocks.push({
                "text": {
                    "type": "plain_text",
                    "text": `${endTimeList[i].value || endTimeList[i]}:00`,
                    "emoji": true
                },
                "value": `${ endTimeList[i].value || endTimeList[i] }`
            })
        }

        return blocks

    }

    startTime(timeList: any[]) {
        this.baseTime = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
        let result:any[] = [];

        _.forEach(timeList, (list: any) => {
            let start = this.baseTime.indexOf(parseInt(list.start))
            let end = this.baseTime.indexOf(parseInt(list.end))
            let occupied = this.baseTime.slice(start, end)
            result = result.concat(...occupied)
        })

        return this.baseTime.filter(x => !result.includes(x));
    }





}


export default new viewController;