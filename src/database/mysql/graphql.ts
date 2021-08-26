import Model from '../_base/model';

class Graphql {
    constructor(model: Model) {
        model = Object.assign(model, {
            graphql: {}
        })
    }
}
