import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CHARACTERISTIC_CATEGORIES, GameException } from '../game/game.types'

const RATINGS = new Set(['everyone', 'teen', 'mature', 'explicit'])

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(input: string) {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9а-яё_-]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48)
  }

  async listPackages(opts?: { activeOnly?: boolean }) {
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
    })

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
    }))
  }

  async getPackage(id: string) {
    const pack = await this.prisma.contentPackage.findUnique({
      where: { id },
      include: {
        disasters: { orderBy: { title: 'asc' } },
        bunkers: { orderBy: { title: 'asc' } },
        characteristics: { orderBy: [{ category: 'asc' }, { title: 'asc' }] },
      },
    })
    if (!pack) throw new GameException('CONTENT_MISSING')

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
    }
  }

  async createPackage(input: {
    slug: string
    title: string
    description?: string
    rating?: string
    topic?: string
    isActive?: boolean
    sortOrder?: number
  }) {
    const slug = this.slugify(input.slug || input.title)
    if (!slug) throw new GameException('INVALID_STATUS')
    const rating = input.rating ?? 'everyone'
    if (!RATINGS.has(rating)) throw new GameException('INVALID_STATUS')

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
      })
    } catch {
      throw new GameException('INVALID_STATUS')
    }
  }

  async updatePackage(
    id: string,
    input: {
      title?: string
      description?: string
      rating?: string
      topic?: string
      isActive?: boolean
      sortOrder?: number
      slug?: string
    },
  ) {
    const pack = await this.prisma.contentPackage.findUnique({ where: { id } })
    if (!pack) throw new GameException('CONTENT_MISSING')
    if (input.rating && !RATINGS.has(input.rating)) {
      throw new GameException('INVALID_STATUS')
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
      })
    } catch {
      throw new GameException('INVALID_STATUS')
    }
  }

  async deletePackage(id: string) {
    const pack = await this.prisma.contentPackage.findUnique({ where: { id } })
    if (!pack) throw new GameException('CONTENT_MISSING')
    if (pack.isBuiltin) throw new GameException('INVALID_STATUS')
    await this.prisma.contentPackage.delete({ where: { id } })
    return { ok: true }
  }

  async createDisaster(
    packageId: string,
    input: { title: string; description: string; isActive?: boolean },
  ) {
    await this.requirePackage(packageId)
    return this.prisma.disaster.create({
      data: {
        packageId,
        title: input.title.trim(),
        description: input.description.trim(),
        isActive: input.isActive ?? true,
      },
    })
  }

  async updateDisaster(
    id: string,
    input: { title?: string; description?: string; isActive?: boolean },
  ) {
    return this.prisma.disaster.update({
      where: { id },
      data: {
        title: input.title?.trim(),
        description: input.description?.trim(),
        isActive: input.isActive,
      },
    })
  }

  async deleteDisaster(id: string) {
    await this.prisma.disaster.delete({ where: { id } })
    return { ok: true }
  }

  async createBunker(
    packageId: string,
    input: { title: string; description: string; isActive?: boolean },
  ) {
    await this.requirePackage(packageId)
    return this.prisma.bunker.create({
      data: {
        packageId,
        title: input.title.trim(),
        description: input.description.trim(),
        isActive: input.isActive ?? true,
      },
    })
  }

  async updateBunker(
    id: string,
    input: { title?: string; description?: string; isActive?: boolean },
  ) {
    return this.prisma.bunker.update({
      where: { id },
      data: {
        title: input.title?.trim(),
        description: input.description?.trim(),
        isActive: input.isActive,
      },
    })
  }

  async deleteBunker(id: string) {
    await this.prisma.bunker.delete({ where: { id } })
    return { ok: true }
  }

  async createCharacteristic(
    packageId: string,
    input: {
      category: string
      title: string
      description?: string | null
      isActive?: boolean
    },
  ) {
    await this.requirePackage(packageId)
    if (!CHARACTERISTIC_CATEGORIES.includes(input.category as never)) {
      throw new GameException('INVALID_STATUS')
    }
    return this.prisma.characteristic.create({
      data: {
        packageId,
        category: input.category,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
      },
    })
  }

  async updateCharacteristic(
    id: string,
    input: {
      category?: string
      title?: string
      description?: string | null
      isActive?: boolean
    },
  ) {
    if (
      input.category &&
      !CHARACTERISTIC_CATEGORIES.includes(input.category as never)
    ) {
      throw new GameException('INVALID_STATUS')
    }
    return this.prisma.characteristic.update({
      where: { id },
      data: {
        category: input.category,
        title: input.title?.trim(),
        description:
          input.description === undefined
            ? undefined
            : input.description?.trim() || null,
        isActive: input.isActive,
      },
    })
  }

  async deleteCharacteristic(id: string) {
    await this.prisma.characteristic.delete({ where: { id } })
    return { ok: true }
  }

  private async requirePackage(id: string) {
    const pack = await this.prisma.contentPackage.findUnique({ where: { id } })
    if (!pack) throw new GameException('CONTENT_MISSING')
    return pack
  }
}
