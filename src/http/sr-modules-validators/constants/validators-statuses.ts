import { ValidatorStatus } from '../../../validators-registry/src';

export const VALIDATORS_STATUSES_FOR_EXIT = [
  ValidatorStatus.ACTIVE_ONGOING,
  ValidatorStatus.PENDING_INITIALIZED,
  ValidatorStatus.PENDING_QUEUED,
];

export const DEFAULT_EXIT_PERCENT = 10;
