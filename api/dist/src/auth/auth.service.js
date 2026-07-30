"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUserId = exports.AuthGuard = exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async ensureAnonymous(existingToken) {
        if (existingToken) {
            try {
                const payload = await this.jwt.verifyAsync(existingToken);
                const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
                if (user) {
                    return { token: existingToken, userId: user.id };
                }
            }
            catch {
            }
        }
        const user = await this.prisma.user.create({ data: {} });
        const token = await this.jwt.signAsync({ sub: user.id });
        return { token, userId: user.id };
    }
    async verify(token) {
        if (!token)
            throw new common_1.UnauthorizedException('UNAUTHORIZED');
        try {
            const payload = await this.jwt.verifyAsync(token);
            return payload.sub;
        }
        catch {
            throw new common_1.UnauthorizedException('UNAUTHORIZED');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
let AuthGuard = class AuthGuard {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const header = req.headers.authorization;
        const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
        const cookieToken = req.cookies?.ls_token;
        const userId = await this.auth.verify(bearer ?? cookieToken);
        req.userId = userId;
        return true;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AuthService])
], AuthGuard);
exports.CurrentUserId = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.userId;
});
//# sourceMappingURL=auth.service.js.map