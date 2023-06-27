## Lido Node Operators Keys Service

Simple Lido keys and validators HTTP API.

## How it works

Service is based on modular architecture. We will have separate library for each type of `Staking Router` module: `Curated`, `Community`, `DVT`. These modules data will be stored in separate tables too. For example, we will have `CuratedKey` and `CommunityKey` tables. API will run cron job to update keys in db for all modules to `latest EL block`. At the moment API support only `NodeOperatorRegistry` contract keys.

## Glossary

- SR - Staking Router contract

## API

### /keys

**GET** `/v1/keys`

Endpoint returns list of keys for all modules.

Query:

- `used` - filter for used/unused keys. Possible values: true/false;
- `operatorIndex` - filter for keys of operator with index `operatorIndex`;

```typescript
interface ELBlockSnapshot {
  blockNumber: number;
  blockHash: string;
  blockTimestamp: number;
}

interface Key {
  key: string;
  depositSignature: string;
  used: boolean;
  operatorIndex: number;
}

interface ModuleKey extends Key {
  moduleAddress: string;
}

class Response {
  data: ModuleKey[];
  meta: {
    elBlockSnapshot: ELBlockSnapshot;
  };
}
interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3000/v1/keys' \
  -H 'accept: application/json'
```

:::warning
Response of this endpoint could be very large but we can’t have a pagination here since data could be updated in the process.
:::

:::warning
If API returns 425 code, it means database is not ready for work
:::

**GET** `/v1/keys/{pubkey}`

Return key by public key with basic fields. `pubkey` should be in lowercase.

```typescript
class Response {
  data: ModuleKey[];
  meta: {
    elBlockSnapshot: ELBlockSnapshot;
  };
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}

class NotFoundException implements HttpException {
  statusCode: number = 404;
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3005/v1/keys/pubkey' \
  -H 'accept: application/json'
```

**POST** `/v1/keys/find`

Returns all keys found in db.

Request body:

```typescript
interface RequestBody {
  // public keys in lowercase
  pubkeys: string[];
}
```

Response:

```typescript
class Response {
  data: ModuleKey[];
  meta: {
    elBlockSnapshot: ElBlockSnapshot;
  };
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}
```

Example:

```
curl -X 'POST' \
  'http://localhost:3000/v1/keys/find' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"pubkeys": ["pubkey0 "]}'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

### /modules

**GET** `/v1/modules`

Endpoint returns list of staking router modules.

```typescript
interface Module {
  nonce: number;
  type: string;
  // unique id of the module
  id: number;
  // address of module
  stakingModuleAddress: string;
  // rewarf fee of the module
  moduleFee: number;
  // treasury fee
  treasuryFee: number;
  // target percent of total keys in protocol, in BP
  targetShare: number;
  // module status if module can not accept the deposits or can participate in further reward distribution
  status: number;
  // name of module
  name: string;
  // block.timestamp of the last deposit of the module
  lastDepositAt: number;
  // block.number of the last deposit of the module
  lastDepositBlock: number;
}

interface ELBlockSnapshot {
  blockNumber: number;
  blockHash: string;
  blockTimestamp: number;
}

class Reponse {
  data: Module[];
  elBlockSnapshot: ElBlockSnapshot;
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3000/v1/modules' \
  -H 'accept: application/json'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

**GET** `/v1/modules/{module_id}`

`module_id` - staking router module contact address or id;

Endpoint return information about staking router module;

```typescript
interface Module {
  nonce: number;
  type: string;
  /// @notice unique id of the module
  id: number;
  /// @notice address of module
  stakingModuleAddress: string;
  /// @notice rewarf fee of the module
  moduleFee: number;
  /// @notice treasury fee
  treasuryFee: number;
  /// @notice target percent of total keys in protocol, in BP
  targetShare: number;
  /// @notice module status if module can not accept the deposits or can participate in further reward distribution
  status: number;
  /// @notice name of module
  name: string;
  /// @notice block.timestamp of the last deposit of the module
  lastDepositAt: number;
  /// @notice block.number of the last deposit of the module
  lastDepositBlock: number;
}

interface ELBlockSnapshot {
  blockNumber: number;
  blockHash: string;
  blockTimestamp: number;
}

class Reponse {
  data: Module;
  elBlockSnapshot: ElBlockSnapshot;
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}

class NotFoundResponse implements HttpException {
  statusCode: number = 404;
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3000/v1/modules/1' \
  -H 'accept: application/json'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

### /modules/keys/

**GET** `/v1/modules/keys/`

Return keys for all modules grouped by staking router module.

Query:

- `used` - filter for used/unused keys. Possible values: true/false;
- `operatorIndex` - filter for keys of operator with index `operatorIndex`;

```typescript
interface Module {
  // current KeyOpIndex
  nonce: number;
  // type of module
  type: string;
  /// @notice unique id of the module
  id: number;
  /// @notice address of module
  stakingModuleAddress: string;
  /// @notice rewarf fee of the module
  moduleFee: number;
  /// @notice treasury fee
  treasuryFee: number;
  /// @notice target percent of total keys in protocol, in BP
  targetShare: number;
  /// @notice module status if module can not accept the deposits or can participate in further reward distribution
  status: number;
  /// @notice name of module
  name: string;
  /// @notice block.timestamp of the last deposit of the module
  lastDepositAt: number;
  /// @notice block.number of the last deposit of the module
  lastDepositBlock: number;
}

class Response {
  data: {
    keys: Key[];
    module: Module;
  }[];
  meta: {
    elBlockSnapshot: ELBlockSnapshot;
  };
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}

class NotFoundException implements HttpException {
  statusCode: number = 404;
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3000/v1/modules/keys?used=true&operatorIndex=1' \
  -H 'accept: application/json'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

**GET** `/v1/modules/{module_id}/keys`

`module_id` - staking router module contact address or id;

Endpoint returns list of keys for module.

Query:

- `used` - filter for used/unused keys. Possible values: true/false;
- `operatorIndex` - filter for keys of operator with index `operatorIndex`;

Response:

Response depends on `module type`

```typescript
interface Key {
  key: string;
  depositSignature: string;
  used: boolean;
  operatorIndex: number;
}

interface RegistryKey extends Key {
  index: number;
}

interface CommunityKey extends Key {}

class Response {
  data: {
    keys: RegistryKey[] | CommunityKey[];
    module: Module;
  };
  meta: {
    elBlockSnapshot: ELBlockSnapshot;
  };
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}

class NotFoundException implements HttpException {
  statusCode: number = 404;
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3000/v1/modules/1/keys?used=true&operatorIndex=1' \
  -H 'accept: application/json'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

**POST** `/v1/modules/{module_id}/keys/find`

`module_id` - staking router module contact address or id;

Returns all keys found in db.

Request body:

```typescript
interface RequestBody {
  // public keys in lowercase
  pubkeys: string[];
}
```

Response:

```typescript
interface Key {
  key: string;
  depositSignature: string;
  used: boolean;
  operatorIndex: number;
}

interface RegistryKey extends Key {
  index: number;
}

interface CommunityKey extends Key {}

class Response {
  data: {
    keys: RegistryKey[] | CommunityKey[];
    module: Module;
  };
  meta: {
    elBlockSnapshot: ElBlockSnapshot;
  };
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}

class NotFoundException implements HttpException {
  statusCode: number = 404;
}
```

Example:

```
curl -X 'POST' \
  'http://localhost:3000/v1/modules/1/keys/find' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "pubkeys": [
    "pubkey"
  ]
}'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

### /validators

**GET** `/v1/modules/{module_id}/validators/validator-exits-to-prepare/{operator_id}`

`module_id` - staking router module contact address or id;

This endpoint will return N of oldest lido validators for earliest epoch when voluntary exit can be processed for specific node operator and specific `StakingRouter` module. Node operator will use this validators list for preparing pre-sign exit messages. API will find `used` keys of node operator and find for these public keys N oldest validators in `Validator` table. We consider active validators (`active_ongoing` status) or validators in `pending_initialized`, `pending_queued` statuses. Module tables state fetched from `EL` should be newer than `Validator` table state fetched from `CL`. Otherwise API will return error on request.

Query:

Only one filter is available. If both parameters are provided, `percent` has a high priority.

- `percent` - Percent of validators to exit. Default value is 10.
- `max_amount` - Number of validators to exit. If validators number less than amount, return all validators.

```typescript
interface Validator {
  validatorIndex: number;
  key: string;
}

interface CLBlockSnapshot {
  epoch: number;
  root: number;
  slot: number;
  blockNumber: number;
  timestamp: number;
  blockHash: string;
}

class Response {
  data: Validator[];
  meta: {
    clBlockSnapshot: CLBlockSnapshot;
  };
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}

class NotFoundException implements HttpException {
  statusCode: number = 404;
}

class InternalServerErrorExceptionNotActualData implements HttpException {
  statusCode: number = 500;
  message: string = 'Last Execution Layer block number in our database older than last Consensus Layer';
}

class InternalServerErrorExceptionDisable implements HttpException {
  statusCode: number = 500;
  message: string = 'Validators Registry is disabled. Check environment variables';
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3000/v1/modules/1/validators/validator-exits-to-prepare/1?percent=10' \
  -H 'accept: application/json'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

**GET** `/v1/modules/{module_id}/validators/generate-unsigned-exit-messages/{operator_id}`

`module_id` - staking router module contact address or id;

Return unsigned exit messages for N oldest validators for earliest epoch when voluntary exit can be processed.

Query:

Only one filter is available. If both parameters are provided, `percent` has a high priority.

- `percent` - Percent of validators to exit. Default value is 10.
- `max_amount` - Number of validators to exit. If validators number less than amount, return all validators.

```typescript
interface ExitPresignMessage {
  validator_index: string;
  epoch: string;
}

interface CLBlockSnapshot {
  epoch: number;
  root: string;
  slot: number;
  blockNumber: number;
  timestamp: number;
  blockHash: string;
}

class Response {
  data: ExitPresignMessage[];
  meta: {
    clBlockSnapshot: CLBlockSnapshot;
  };
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}

class NotFoundException implements HttpException {
  statusCode: number = 404;
}

class InternalServerErrorExceptionNotActualData implements HttpException {
  statusCode: number = 500;
  message: string = 'Last Execution Layer block number in our database older than last Consensus Layer';
}

class InternalServerErrorExceptionDisable implements HttpException {
  statusCode: number = 500;
  message: string = 'Validators Registry is disabled. Check environment variables';
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3000/v1/modules/1/validators/generate-unsigned-exit-messages/1?percent=10' \
  -H 'accept: application/json'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

### /operators

**GET** `/v1/operators`

List of operators grouped by staking router module

Query

```typescript
interface Operator {
  index: number;
  active: boolean;
}

interface CuratedOperator extends Operator {
  name: string;
  rewardAddress: string;
  stakingLimit: number;
  stoppedValidators: number;
  totalSigningKeys: number;
  usedSigningKeys: number;
}

interface CommunityOperator extends Operator {}

class Response {
  data: {
    operators: CuratedOperator[] | CommunityOperator[];
    module: Module;
  }[];
  meta: {
    elBlockSnapshot: ELBlockSnapshot;
  };
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3000/v1/operators' \
  -H 'accept: application/json'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

**GET** `/v1/modules/{module_id}/operators/`

`module_id` - staking router module contact address or id;

List of SR module operators

```typescript
class Response {
  data: {
    operators: CuratedOperator[] | CommunityOperator[];
    module: Module;
  };
  meta: {
    elBlockSnapshot: ELBlockSnapshot;
  };
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}

class NotFoundException implements HttpException {
  statusCode: number = 404;
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3000/v1/modules/1/operators' \
  -H 'accept: application/json'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

**GET** `/v1/modules/{module_id}/operators/{operator_id}`

`module_id` - staking router module contact address or id;
`operator_id` - operator index;

List of SR module operators

```typescript
class Response {
  data: {
    operators: CuratedOperator | CommunityOperator;
    module: Module;
  };
  meta: {
    elBlockSnapshot: ELBlockSnapshot;
  };
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}

class NotFoundException implements HttpException {
  statusCode: number = 404;
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3005/v1/modules/1/operators/1' \
  -H 'accept: application/json'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

**GET** `/v1/modules/{module_id}/operators/keys`

`module_id` - staking router module contact address or id;

Query:

- `used` - filter for used/unused keys. Possible values: true/false;
- `operatorIndex` - filter for keys of operator with index `operatorIndex`;

```typescript
class Response {
  data: {
    keys: RegistryKey[] | CommunityKey[];
    operators: CuratedOperator[] | CommunityOperator[];
    module: Module;
  };
  meta: {
    elBlockSnapshot: ELBlockSnapshot;
  };
}

interface HttpException {
  statusCode: number;
  message: string;
}

class TooEarlyResponse implements HttpException {
  statusCode: number = 425;
  message: string = 'Too early response';
}

class NotFoundException implements HttpException {
  statusCode: number = 404;
}
```

Example:

```
curl -X 'GET' \
  'http://localhost:3005/v1/modules/1/operators/1' \
  -H 'accept: application/json'
```

:::warning
If API returns 425 code, it means database is not ready for work
:::

### /status

**GET** /v1/status

```typescript
class Response {
  // keys api version
  appVersion: string;
  chainId: number;
  elBlockSnapshot: ELBlockSnapshot;
  clBlockSnapshot: CLBlockSnapshot;
}
```

## Requirements

1. 2 core CPU
2. 5 GB RAM
   - Keys-API-DB — 500MB
   - Keys-API — 4GB
3. EL Full node
4. CL node for applications like Ejector that use [validators API](https://hackmd.io/fv8btyNTTOGLZI6LqYyYIg?view#validators). KAPI currently doesn't work with Nimbus client. If you use Teku client, please use archive mode.

## Installation

`$ yarn install`

## Running

`$ yarn start:dev`

For running locally in container run

1. `docker-compose -f docker-compose.yml build`
2. `docker-compose -f docker-compose.yml up`
3. `docker-compose -f docker-compose.metrics.yml build`
4. `docker-compose -f docker-compose.metrics.yml up`

To configure grafana go to `http://localhost:8000/dashboards` and dashboards from `./grafana` folder.

For running KAPI you can also use image from this page https://docs.lido.fi/guides/tooling#keys-api. Please always use the SHA256 hash of the Docker image for the latest release: lidofinance/lido-keys-api@<latest-hash>.

## Tests

Unit tests

`$ yarn test`

## Environment variable

Check `sample.env` file.

Pay attention that API by default running job for fetching and updating Validators. If you are not planning to use `validators` endpoints, you could disable this job by setting `VALIDATOR_REGISTRY_ENABLE=false`.

## Benchmarks

To see record output in file and send metrics to prometheus run command
`K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write k6 run --out json=benchmarks/output.json -o experimental-prometheus-rw --tag testid=<SET-HERE-A-UNIQUE-ID> benchmarks/200.script.js`

## Release flow

To create new release:

1. Merge all changes to the `main` branch
1. Navigate to Repo => Actions
1. Run action "Prepare release" action against `main` branch
1. When action execution is finished, navigate to Repo => Pull requests
1. Find pull request named "chore(release): X.X.X" review and merge it with "Rebase and merge" (or "Squash and merge")
1. After merge release action will be triggered automatically
1. Navigate to Repo => Actions and see last actions logs for further details

## License

API Template is [MIT licensed](LICENSE).
