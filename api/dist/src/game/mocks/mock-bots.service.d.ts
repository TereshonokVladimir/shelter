import { PrismaService } from '../../prisma/prisma.service';
export declare class MockBotsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assertEnabled(): void;
    private requireHost;
    private parseJson;
    addMockPlayers(userId: string, roomId: string, count?: number): Promise<{
        added: number;
        players: {
            id: string;
            name: string;
            userId: string;
            roomId: string;
            role: string;
            status: string;
            joinedAt: Date;
            lastSeenAt: Date | null;
            eliminatedAt: Date | null;
        }[];
    }>;
    runBots(userId: string, roomId: string): Promise<{
        acted: number;
        status: string;
    }>;
}
