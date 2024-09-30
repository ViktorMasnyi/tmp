export default {
    body: {
        type: 'object',
        required: ['height', 'id', 'transactions'],
        properties: {
            height: {type: 'number'},
            id: {type: 'string'},
            transactions: {
                type: 'array', items:
                    {type: 'object',
                        properties: {
                            id: {type: 'string'},
                            inputs: {type: 'array', items: {type: 'object', properties: {txId: {type: 'string'}, index: {type: 'number'}}}},
                            outputs: {type: 'array', items: {type: 'object', properties: {address: {type: 'string'}, value: {type: 'number'}}}}
                        }
                    }
                },
        }
    },
    response: {
        201: {
            type: 'object',
            properties: {
                message: {type: 'string'}
            }
        }
    }

}
