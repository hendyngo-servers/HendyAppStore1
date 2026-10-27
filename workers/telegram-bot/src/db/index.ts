import { DatabaseService } from '../../../platform-api/src/services/database';

export const getBotDatabase = (cfDb?: any) => DatabaseService.getInstance(cfDb);
