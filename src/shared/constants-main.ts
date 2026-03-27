import { ServiceError } from '@grpc/grpc-js';

import { Records } from './pb/api';

export interface GetRecordsResponseArgs {
  err?: ServiceError | null;
  res?: Records;
}
