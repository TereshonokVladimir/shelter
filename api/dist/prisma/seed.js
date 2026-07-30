"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const seed_data_1 = require("./seed-data");
const game_rarity_1 = require("../src/game/game.rarity");
const prisma = new client_1.PrismaClient();
function charTitle(item) {
    return typeof item === 'string' ? item : item[0];
}
function toCharacteristic(packageId, category, item) {
    const title = charTitle(item);
    const description = typeof item === 'string' ? null : item[1];
    return {
        packageId,
        category,
        title,
        description,
        rarity: (0, game_rarity_1.rarityFromTitle)(title),
    };
}
async function upsertPack(pack) {
    const existing = await prisma.contentPackage.findUnique({ where: { slug: pack.slug } });
    const row = existing
        ? await prisma.contentPackage.update({
            where: { id: existing.id },
            data: {
                title: pack.title,
                description: pack.description,
                rating: pack.rating,
                topic: pack.topic,
                sortOrder: pack.sortOrder,
                isActive: true,
                isBuiltin: true,
            },
        })
        : await prisma.contentPackage.create({
            data: {
                ...(pack.slug === 'classic' ? { id: 'pkg_classic_default' } : {}),
                slug: pack.slug,
                title: pack.title,
                description: pack.description,
                rating: pack.rating,
                topic: pack.topic,
                sortOrder: pack.sortOrder,
                isActive: true,
                isBuiltin: true,
            },
        });
    const packageId = row.id;
    const existingDisasters = new Set((await prisma.disaster.findMany({
        where: { packageId },
        select: { title: true },
    })).map((d) => d.title));
    const newDisasters = pack.disasters.filter(([title]) => !existingDisasters.has(title));
    if (newDisasters.length) {
        await prisma.disaster.createMany({
            data: newDisasters.map(([title, description]) => ({ packageId, title, description })),
        });
        console.log(`  +disasters ${pack.slug}: ${newDisasters.length}`);
    }
    const existingBunkers = new Set((await prisma.bunker.findMany({
        where: { packageId },
        select: { title: true },
    })).map((b) => b.title));
    const newBunkers = pack.bunkers.filter(([title]) => !existingBunkers.has(title));
    if (newBunkers.length) {
        await prisma.bunker.createMany({
            data: newBunkers.map(([title, description]) => ({ packageId, title, description })),
        });
        console.log(`  +bunkers ${pack.slug}: ${newBunkers.length}`);
    }
    for (const [category, items] of Object.entries(pack.characteristics)) {
        const existingTitles = new Set((await prisma.characteristic.findMany({
            where: { packageId, category },
            select: { title: true },
        })).map((c) => c.title));
        const missing = items.filter((item) => !existingTitles.has(charTitle(item)));
        if (!missing.length)
            continue;
        await prisma.characteristic.createMany({
            data: missing.map((item) => toCharacteristic(packageId, category, item)),
        });
        console.log(`  +${category} ${pack.slug}: ${missing.length}`);
    }
    const packChars = await prisma.characteristic.findMany({
        where: { packageId },
        select: { id: true, title: true, rarity: true },
    });
    let rarityUpdates = 0;
    for (const row of packChars) {
        const next = (0, game_rarity_1.rarityFromTitle)(row.title);
        if (row.rarity !== next) {
            await prisma.characteristic.update({ where: { id: row.id }, data: { rarity: next } });
            rarityUpdates += 1;
        }
    }
    if (rarityUpdates)
        console.log(`  ~rarity ${pack.slug}: ${rarityUpdates}`);
    const actions = pack.actions?.length ? pack.actions : seed_data_1.DEFAULT_ACTIONS;
    const existingActions = new Set((await prisma.actionCard.findMany({
        where: { packageId },
        select: { title: true },
    })).map((a) => a.title));
    const newActions = actions.filter((a) => !existingActions.has(a.title));
    if (newActions.length) {
        await prisma.actionCard.createMany({
            data: newActions.map((a) => ({
                packageId,
                effectType: a.effectType,
                title: a.title,
                description: a.description,
            })),
        });
        console.log(`  +actions ${pack.slug}: ${newActions.length}`);
    }
    return packageId;
}
async function main() {
    console.log('Seeding content packages…');
    for (const pack of seed_data_1.builtinPacks) {
        console.log(`Pack: ${pack.slug}`);
        await upsertPack(pack);
    }
    const totals = await Promise.all([
        prisma.contentPackage.count(),
        prisma.disaster.count(),
        prisma.bunker.count(),
        prisma.characteristic.count(),
        prisma.actionCard.count(),
    ]);
    console.log(`Seed ready: packages=${totals[0]}, disasters=${totals[1]}, bunkers=${totals[2]}, characteristics=${totals[3]}, actions=${totals[4]}`);
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map