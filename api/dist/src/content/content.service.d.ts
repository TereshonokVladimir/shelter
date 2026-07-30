import { PrismaService } from '../prisma/prisma.service';
export declare class ContentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private slugify;
    listPackages(opts?: {
        activeOnly?: boolean;
    }): Promise<{
        id: string;
        slug: string;
        title: string;
        description: string;
        rating: string;
        topic: string;
        is_active: boolean;
        is_builtin: boolean;
        sort_order: number;
        counts: {
            disasters: number;
            bunkers: number;
            characteristics: number;
        };
    }[]>;
    getPackage(id: string): Promise<{
        id: string;
        slug: string;
        title: string;
        description: string;
        rating: string;
        topic: string;
        is_active: boolean;
        is_builtin: boolean;
        sort_order: number;
        disasters: {
            id: string;
            title: string;
            description: string;
            is_active: boolean;
        }[];
        bunkers: {
            id: string;
            title: string;
            description: string;
            is_active: boolean;
        }[];
        characteristics: {
            id: string;
            category: string;
            title: string;
            description: string | null;
            is_active: boolean;
        }[];
    }>;
    createPackage(input: {
        slug: string;
        title: string;
        description?: string;
        rating?: string;
        topic?: string;
        isActive?: boolean;
        sortOrder?: number;
    }): Promise<{
        id: string;
        slug: string;
        title: string;
        description: string;
        rating: string;
        topic: string;
        isActive: boolean;
        isBuiltin: boolean;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePackage(id: string, input: {
        title?: string;
        description?: string;
        rating?: string;
        topic?: string;
        isActive?: boolean;
        sortOrder?: number;
        slug?: string;
    }): Promise<{
        id: string;
        slug: string;
        title: string;
        description: string;
        rating: string;
        topic: string;
        isActive: boolean;
        isBuiltin: boolean;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePackage(id: string): Promise<{
        ok: boolean;
    }>;
    createDisaster(packageId: string, input: {
        title: string;
        description: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        title: string;
        description: string;
        isActive: boolean;
        packageId: string;
    }>;
    updateDisaster(id: string, input: {
        title?: string;
        description?: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        title: string;
        description: string;
        isActive: boolean;
        packageId: string;
    }>;
    deleteDisaster(id: string): Promise<{
        ok: boolean;
    }>;
    createBunker(packageId: string, input: {
        title: string;
        description: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        title: string;
        description: string;
        isActive: boolean;
        packageId: string;
    }>;
    updateBunker(id: string, input: {
        title?: string;
        description?: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        title: string;
        description: string;
        isActive: boolean;
        packageId: string;
    }>;
    deleteBunker(id: string): Promise<{
        ok: boolean;
    }>;
    createCharacteristic(packageId: string, input: {
        category: string;
        title: string;
        description?: string | null;
        isActive?: boolean;
    }): Promise<{
        id: string;
        title: string;
        description: string | null;
        isActive: boolean;
        packageId: string;
        category: string;
        rarity: string;
    }>;
    updateCharacteristic(id: string, input: {
        category?: string;
        title?: string;
        description?: string | null;
        isActive?: boolean;
    }): Promise<{
        id: string;
        title: string;
        description: string | null;
        isActive: boolean;
        packageId: string;
        category: string;
        rarity: string;
    }>;
    deleteCharacteristic(id: string): Promise<{
        ok: boolean;
    }>;
    private requirePackage;
}
