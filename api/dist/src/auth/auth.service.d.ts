import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export type AuthUser = {
    userId: string;
};
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    ensureAnonymous(existingToken?: string): Promise<{
        token: string;
        userId: string;
    }>;
    verify(token?: string): Promise<string>;
}
export declare class AuthGuard implements CanActivate {
    private readonly auth;
    constructor(auth: AuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare const CurrentUserId: (...dataOrPipes: unknown[]) => ParameterDecorator;
