import { ContentService } from './content.service';
export declare class ContentController {
    private readonly content;
    constructor(content: ContentService);
    private wrap;
    private assertAdmin;
    listPackages(): Promise<{
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
    listAdminPackages(token?: string): Promise<{
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
    getAdminPackage(token: string | undefined, id: string): Promise<{
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
    createPackage(token: string | undefined, body: {
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
    updatePackage(token: string | undefined, id: string, body: {
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
    deletePackage(token: string | undefined, id: string): Promise<{
        ok: boolean;
    }>;
    createDisaster(token: string | undefined, packageId: string, body: {
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
    updateDisaster(token: string | undefined, id: string, body: {
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
    deleteDisaster(token: string | undefined, id: string): Promise<{
        ok: boolean;
    }>;
    createBunker(token: string | undefined, packageId: string, body: {
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
    updateBunker(token: string | undefined, id: string, body: {
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
    deleteBunker(token: string | undefined, id: string): Promise<{
        ok: boolean;
    }>;
    createCharacteristic(token: string | undefined, packageId: string, body: {
        category: string;
        title: string;
        description?: string | null;
        isActive?: boolean;
    }): Promise<{
        id: string;
        title: string;
        description: string | null;
        isActive: boolean;
        category: string;
        packageId: string;
        rarity: string;
    }>;
    updateCharacteristic(token: string | undefined, id: string, body: {
        category?: string;
        title?: string;
        description?: string | null;
        isActive?: boolean;
    }): Promise<{
        id: string;
        title: string;
        description: string | null;
        isActive: boolean;
        category: string;
        packageId: string;
        rarity: string;
    }>;
    deleteCharacteristic(token: string | undefined, id: string): Promise<{
        ok: boolean;
    }>;
}
