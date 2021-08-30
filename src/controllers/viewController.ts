class viewController {

    private availTime: any[] = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

    setStartTime(timeList?: any[]) {
        const blocks: any[] = [];
        const startTime = this.startTime(timeList || this.availTime)


        for (let i = 0; i < startTime.length - 1; i++) {
            blocks.push({
                "text": {
                    "type": "plain_text",
                    "text": `${startTime[i]}:00`,
                    "emoji": true
                },
                "value": `${startTime[i]}`
            })
        }
        return blocks
    }

    setEndTime(startTime?: number) {
        const blocks: any[] = [];
        let endTimeList =  this.availTime;
        if(startTime) {
            const index = this.availTime.findIndex(elem => {
                return elem == startTime;
            });
            endTimeList = this.availTime.slice(index)

        }


        for (let i = 1; i < endTimeList.length; i++) {
            blocks.push({
                "text": {
                    "type": "plain_text",
                    "text": `${endTimeList[i]}:00`,
                    "emoji": true
                },
                "value": `${endTimeList[i]}`
            })
        }

        return blocks

    }

    startTime(timeList: any[]) {
        return this.availTime.filter(x => !timeList.includes(x.toString()));
    }

    // endTime(time: number) {
    //
    //     const index:number = this.availTime.findIndex(elem => {
    //         return elem == time;
    //     });
    //
    //     this.setEndTime(this.availTime.slice(index))
    //
    // }


}


export default new viewController;