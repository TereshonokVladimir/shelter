"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    const origin = config.get('WEB_ORIGIN') ?? 'http://localhost:3000';
    app.use((0, cookie_parser_1.default)());
    app.enableCors({
        origin: origin.split(','),
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    app.setGlobalPrefix('api');
    const port = Number(config.get('PORT') ?? 4000);
    await app.listen(port);
    console.log(`Last Shelter API listening on http://localhost:${port}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map