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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const content_service_1 = require("./content.service");
const game_types_1 = require("../game/game.types");
let ContentController = class ContentController {
    content;
    constructor(content) {
        this.content = content;
    }
    wrap(fn) {
        return fn().catch((error) => {
            if (error instanceof game_types_1.GameException) {
                throw new common_1.HttpException({ code: error.code, message: error.message }, common_1.HttpStatus.BAD_REQUEST);
            }
            throw error;
        });
    }
    assertAdmin(token) {
        const expected = process.env.ADMIN_TOKEN;
        if (!expected) {
            throw new common_1.HttpException({ code: 'ADMIN_DISABLED', message: 'ADMIN_TOKEN не задан на сервере' }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (!token || token !== expected) {
            throw new common_1.HttpException({ code: 'FORBIDDEN_ADMIN', message: 'Нужен токен администратора' }, common_1.HttpStatus.FORBIDDEN);
        }
    }
    listPackages() {
        return this.wrap(() => this.content.listPackages({ activeOnly: true }));
    }
    listAdminPackages(token) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.listPackages({ activeOnly: false }));
    }
    getAdminPackage(token, id) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.getPackage(id));
    }
    createPackage(token, body) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.createPackage(body));
    }
    updatePackage(token, id, body) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.updatePackage(id, body));
    }
    deletePackage(token, id) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.deletePackage(id));
    }
    createDisaster(token, packageId, body) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.createDisaster(packageId, body));
    }
    updateDisaster(token, id, body) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.updateDisaster(id, body));
    }
    deleteDisaster(token, id) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.deleteDisaster(id));
    }
    createBunker(token, packageId, body) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.createBunker(packageId, body));
    }
    updateBunker(token, id, body) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.updateBunker(id, body));
    }
    deleteBunker(token, id) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.deleteBunker(id));
    }
    createCharacteristic(token, packageId, body) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.createCharacteristic(packageId, body));
    }
    updateCharacteristic(token, id, body) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.updateCharacteristic(id, body));
    }
    deleteCharacteristic(token, id) {
        this.assertAdmin(token);
        return this.wrap(() => this.content.deleteCharacteristic(id));
    }
};
exports.ContentController = ContentController;
__decorate([
    (0, common_1.Get)('packages'),
    (0, common_1.UseGuards)(auth_service_1.AuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "listPackages", null);
__decorate([
    (0, common_1.Get)('admin/packages'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "listAdminPackages", null);
__decorate([
    (0, common_1.Get)('admin/packages/:id'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "getAdminPackage", null);
__decorate([
    (0, common_1.Post)('admin/packages'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "createPackage", null);
__decorate([
    (0, common_1.Patch)('admin/packages/:id'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "updatePackage", null);
__decorate([
    (0, common_1.Delete)('admin/packages/:id'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "deletePackage", null);
__decorate([
    (0, common_1.Post)('admin/packages/:id/disasters'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "createDisaster", null);
__decorate([
    (0, common_1.Patch)('admin/disasters/:id'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "updateDisaster", null);
__decorate([
    (0, common_1.Delete)('admin/disasters/:id'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "deleteDisaster", null);
__decorate([
    (0, common_1.Post)('admin/packages/:id/bunkers'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "createBunker", null);
__decorate([
    (0, common_1.Patch)('admin/bunkers/:id'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "updateBunker", null);
__decorate([
    (0, common_1.Delete)('admin/bunkers/:id'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "deleteBunker", null);
__decorate([
    (0, common_1.Post)('admin/packages/:id/characteristics'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "createCharacteristic", null);
__decorate([
    (0, common_1.Patch)('admin/characteristics/:id'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "updateCharacteristic", null);
__decorate([
    (0, common_1.Delete)('admin/characteristics/:id'),
    __param(0, (0, common_1.Headers)('x-admin-token')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "deleteCharacteristic", null);
exports.ContentController = ContentController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [content_service_1.ContentService])
], ContentController);
//# sourceMappingURL=content.controller.js.map