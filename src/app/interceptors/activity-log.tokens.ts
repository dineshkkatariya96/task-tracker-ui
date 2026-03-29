import { HttpContextToken } from '@angular/common/http';

export const LOG_SUCCESSFUL_READ_REQUEST = new HttpContextToken<boolean>(() => false);
