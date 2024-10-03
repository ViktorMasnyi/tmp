# Implementation Details

## Overview
This project implements a simple blockchain indexer with the following functionalities:
- Adding new blocks and updating balances.
- Validating blocks and transactions.
- Retrieving the balance of a specific address.
- Rolling back the state to a previous block height.

## Endpoints

### `POST /block`
This endpoint accepts a new block and updates the balance of each address accordingly. It performs the following validations:
* Service layer
    1. The `height` of the new block must be exactly one unit higher than the current height.
    2. The sum of the values of the inputs must be equal to the sum of the values of the outputs.
    3. The `id` of the block must be the SHA-256 hash of the concatenation of its height and the IDs of its transactions.
* Controller layer
    1. The request body must contain a valid block object according to JSON schema provided.
### `GET /balance/:address`
This endpoint returns the current balance of the given address.
It performs the following validations:
* Controller layer
    1. The address path must be a valid string and not empty, according to JSON schema provided.

### `POST /rollback?height=number`
This endpoint rolls back the state of the indexer to the given height, undoing all transactions added after the specified height and recalculating the balances.
It performs the following validations:
* Service layer
    1. The height query parameter must be a valid number and not empty, according to JSON schema provided.
* Controller layer
    1. The height query parameter must be bigger by 1, compared with the last block stores in DB.

### Sings to be accomplished
- add app configuration with environment variables validation
- add e2e tests, using test database
- consider adding HTTPS to the app itself or to the reverse proxy
- add authentication and authorization for API
- add test with big dataset to check performance
- add table data rotation to avoid storing more than 2000 blocks
- harden the API security by adding CORS, csrf-token
- add logging to the app, with log levels support
- add monitoring to the app, with metrics and alerts (datadog, sentry, cloudwatch etc.)
- add health check endpoint (for K8S, ECS, etc.)
- add ORM to be able to maintain the database schema migrations
- add graceful shutdown to the app
