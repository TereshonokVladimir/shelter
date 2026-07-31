export type GameStatus = 'lobby' | 'prep' | 'reveal' | 'presentation' | 'discussion' | 'voting' | 'vote_result' | 'finished';
export type RoomRole = 'host' | 'player';
export type PlayerStatus = 'active' | 'eliminated' | 'disconnected';
export type CharacteristicCategory = 'profession' | 'biology' | 'health' | 'hobby' | 'phobia' | 'baggage' | 'personality' | 'fact';
export declare const CHARACTERISTIC_CATEGORIES: CharacteristicCategory[];
export declare const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export declare const ERROR_MESSAGES: Record<string, string>;
export declare class GameException extends Error {
    readonly code: string;
    constructor(code: string);
}
export declare function calculateShelterCapacity(playerCount: number): number;
export declare function generateRoomCode(random?: () => number): string;
export declare function normalizeRoomCode(code: string): string;
export declare function shuffle<T>(items: T[], random?: () => number): T[];
export declare function normalizeGameStatus(status: string): GameStatus;
export declare function isPresentationStatus(status: string): boolean;
