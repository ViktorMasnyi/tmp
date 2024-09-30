export default {
    querystring: {
        type: 'object',
        required: ['height'],
        properties: {
            height: {type: 'string'}
        }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                message: {type: 'string'}
            }
        }
    }
}
