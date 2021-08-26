import construct = Reflect.construct;

const host = `http://localhost:8088`;
const api_version = `api/v1`;

class DeployApp {
    private options: any;
    private _game?: Game;

    public initialize(options: any) {
        this.options = options;

        return new Promise(async (resolve, reject) => {

            this._game = new Game(options);
        })
    }

    get game() {
        if( this._game ) {
            return this._game;
        }
    }
}


export default new DeployApp()


class Game {
    private options: any;

    constructor(options: any) {
        this.options = options;
    }

    public async getList() {
        const input = `${host}/${api_version}`
        await fetch(input, {})
    }
}