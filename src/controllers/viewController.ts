class viewController {


    time(){
        let time = 0;
        let blocks = [];

        for(let i = 10; i < 24; i++){
          blocks.push({
                "text": {
                    "type": "plain_text",
                    "text": `${i}:00`,
                    "emoji": true
                },
                "value": `${i}:00`
            } )
        }

return blocks
    }

}


export default new viewController;