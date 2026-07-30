import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    anonymous(authorization?: string, body?: {
        token?: string;
    }): Promise<{
        token: string;
        userId: string;
    }>;
}
