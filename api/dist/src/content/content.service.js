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
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const game_types_1 = require("../game/game.types");
const RATINGS = new Set(['everyone', 'teen', 'mature', 'explicit']);
let ContentService = class ContentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    slugify(input) {
        return input
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9а-яё_-]+/gi, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 48);
    }
    async listPackages(opts) {
        const packages = await this.prisma.contentPackage.findMany({
            where: opts?.activeOnly ? { isActive: true } : undefined,
            orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
            include: {
                _count: {
                    select: {
                        disasters: true,
                        bunkers: true,
                        characteristics: true,
                    },
                },
            },
        });
        return packages.map((pack) => ({
            id: pack.id,
            slug: pack.slug,
            title: pack.title,
            description: pack.description,
            rating: pack.rating,
            topic: pack.topic,
            is_active: pack.isActive,
            is_builtin: pack.isBuiltin,
            sort_order: pack.sortOrder,
            counts: {
                disasters: pack._count.disasters,
                bunkers: pack._count.bunkers,
                characteristics: pack._count.characteristics,
            },
        }));
    }
    async getPackage(id) {
        const pack = await this.prisma.contentPackage.findUnique({
            where: { id },
            include: {
                disasters: { orderBy: { title: 'asc' } },
                bunkers: { orderBy: { title: 'asc' } },
                characteristics: { orderBy: [{ category: 'asc' }, { title: 'asc' }] },
            },
        });
        if (!pack)
            throw new game_types_1.GameException('CONTENT_MISSING');
        return {
            id: pack.id,
            slug: pack.slug,
            title: pack.title,
            description: pack.description,
            rating: pack.rating,
            topic: pack.topic,
            is_active: pack.isActive,
            is_builtin: pack.isBuiltin,
            sort_order: pack.sortOrder,
            disasters: pack.disasters.map((d) => ({
                id: d.id,
                title: d.title,
                description: d.description,
                is_active: d.isActive,
            })),
            bunkers: pack.bunkers.map((b) => ({
                id: b.id,
                title: b.title,
                description: b.description,
                is_active: b.isActive,
            })),
            characteristics: pack.characteristics.map((c) => ({
                id: c.id,
                category: c.category,
                title: c.title,
                description: c.description,
                is_active: c.isActive,
            })),
        };
    }
    async createPackage(input) {
        const slug = this.slugify(input.slug || input.title);
        if (!slug)
            throw new game_types_1.GameException('INVALID_STATUS');
        const rating = input.rating ?? 'everyone';
        if (!RATINGS.has(rating))
            throw new game_types_1.GameException('INVALID_STATUS');
        try {
            return await this.prisma.contentPackage.create({
                data: {
                    slug,
                    title: input.title.trim(),
                    description: (input.description ?? '').trim(),
                    rating,
                    topic: (input.topic ?? 'custom').trim() || 'custom',
                    isActive: input.isActive ?? true,
                    isBuiltin: false,
                    sortOrder: input.sortOrder ?? 100,
                },
            });
        }
        catch {
            throw new game_types_1.GameException('INVALID_STATUS');
        }
    }
    async updatePackage(id, input) {
        const pack = await this.prisma.contentPackage.findUnique({ where: { id } });
        if (!pack)
            throw new game_types_1.GameException('CONTENT_MISSING');
        if (input.rating && !RATINGS.has(input.rating)) {
            throw new game_types_1.GameException('INVALID_STATUS');
        }
        try {
            return await this.prisma.contentPackage.update({
                where: { id },
                data: {
                    title: input.title?.trim(),
                    description: input.description?.trim(),
                    rating: input.rating,
                    topic: input.topic?.trim(),
                    isActive: input.isActive,
                    sortOrder: input.sortOrder,
                    slug: input.slug ? this.slugify(input.slug) : undefined,
                },
            });
        }
        catch {
            throw new game_types_1.GameException('INVALID_STATUS');
        }
    }
    async deletePackage(id) {
        const pack = await this.prisma.contentPackage.findUnique({ where: { id } });
        if (!pack)
            throw new game_types_1.GameException('CONTENT_MISSING');
        if (pack.isBuiltin)
            throw new game_types_1.GameException('INVALID_STATUS');
        await this.prisma.contentPackage.delete({ where: { id } });
        return { ok: true };
    }
    async createDisaster(packageId, input) {
        await this.requirePackage(packageId);
        return this.prisma.disaster.create({
            data: {
                packageId,
                title: input.title.trim(),
                description: input.description.trim(),
                isActive: input.isActive ?? true,
            },
        });
    }
    async updateDisaster(id, input) {
        return this.prisma.disaster.update({
            where: { id },
            data: {
                title: input.title?.trim(),
                description: input.description?.trim(),
                isActive: input.isActive,
            },
        });
    }
    async deleteDisaster(id) {
        await this.prisma.disaster.delete({ where: { id } });
        return { ok: true };
    }
    async createBunker(packageId, input) {
        await this.requirePackage(packageId);
        return this.prisma.bunker.create({
            data: {
                packageId,
                title: input.title.trim(),
                description: input.description.trim(),
                isActive: input.isActive ?? true,
            },
        });
    }
    async updateBunker(id, input) {
        return this.prisma.bunker.update({
            where: { id },
            data: {
                title: input.title?.trim(),
                description: input.description?.trim(),
                isActive: input.isActive,
            },
        });
    }
    async deleteBunker(id) {
        await this.prisma.bunker.delete({ where: { id } });
        return { ok: true };
    }
    async createCharacteristic(packageId, input) {
        await this.requirePackage(packageId);
        if (!game_types_1.CHARACTERISTIC_CATEGORIES.includes(input.category)) {
            throw new game_types_1.GameException('INVALID_STATUS');
        }
        return this.prisma.characteristic.create({
            data: {
                packageId,
                category: input.category,
                title: input.title.trim(),
                description: input.description?.trim() || null,
                isActive: input.isActive ?? true,
            },
        });
    }
    async updateCharacteristic(id, input) {
        if (input.category &&
            !game_types_1.CHARACTERISTIC_CATEGORIES.includes(input.category)) {
            throw new game_types_1.GameException('INVALID_STATUS');
        }
        return this.prisma.characteristic.update({
            where: { id },
            data: {
                category: input.category,
                title: input.title?.trim(),
                description: input.description === undefined
                    ? undefined
                    : input.description?.trim() || null,
                isActive: input.isActive,
            },
        });
    }
    async deleteCharacteristic(id) {
        await this.prisma.characteristic.delete({ where: { id } });
        return { ok: true };
    }
    async requirePackage(id) {
        const pack = await this.prisma.contentPackage.findUnique({ where: { id } });
        if (!pack)
            throw new game_types_1.GameException('CONTENT_MISSING');
        return pack;
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContentService);
//# sourceMappingURL=content.service.js.map