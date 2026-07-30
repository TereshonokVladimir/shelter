import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
export declare class EventsGateway implements OnGatewayConnection {
    private readonly auth;
    server: Server;
    constructor(auth: AuthService);
    handleConnection(client: Socket): Promise<void>;
    handleJoin(client: Socket, body: {
        code: string;
    }): {
        ok: boolean;
        room: string;
    } | undefined;
    emitRoomUpdated(code: string): void;
}
