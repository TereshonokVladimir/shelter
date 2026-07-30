"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builtinPacks = exports.DEFAULT_ACTIONS = exports.hardcorePack = exports.memePack = exports.classicPack = void 0;
const pack_classic_1 = require("./pack-classic");
Object.defineProperty(exports, "classicPack", { enumerable: true, get: function () { return pack_classic_1.classicPack; } });
const pack_meme_1 = require("./pack-meme");
Object.defineProperty(exports, "memePack", { enumerable: true, get: function () { return pack_meme_1.memePack; } });
const pack_hardcore_1 = require("./pack-hardcore");
Object.defineProperty(exports, "hardcorePack", { enumerable: true, get: function () { return pack_hardcore_1.hardcorePack; } });
const actions_1 = require("./actions");
Object.defineProperty(exports, "DEFAULT_ACTIONS", { enumerable: true, get: function () { return actions_1.DEFAULT_ACTIONS; } });
exports.builtinPacks = [pack_classic_1.classicPack, pack_meme_1.memePack, pack_hardcore_1.hardcorePack];
//# sourceMappingURL=index.js.map