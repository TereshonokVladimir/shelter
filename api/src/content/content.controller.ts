import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '../auth/auth.service'
import { ContentService } from './content.service'
import { GameException } from '../game/game.types'

@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  private wrap<T>(fn: () => Promise<T>): Promise<T> {
    return fn().catch((error: unknown) => {
      if (error instanceof GameException) {
        throw new HttpException(
          { code: error.code, message: error.message },
          HttpStatus.BAD_REQUEST,
        )
      }
      throw error
    })
  }

  private assertAdmin(token?: string) {
    const expected = process.env.ADMIN_TOKEN
    if (!expected) {
      throw new HttpException(
        { code: 'ADMIN_DISABLED', message: 'ADMIN_TOKEN не задан на сервере' },
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
    if (!token || token !== expected) {
      throw new HttpException(
        { code: 'FORBIDDEN_ADMIN', message: 'Нужен токен администратора' },
        HttpStatus.FORBIDDEN,
      )
    }
  }

  /** Public: active packs for room creation */
  @Get('packages')
  @UseGuards(AuthGuard)
  listPackages() {
    return this.wrap(() => this.content.listPackages({ activeOnly: true }))
  }

  @Get('admin/packages')
  listAdminPackages(@Headers('x-admin-token') token?: string) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.listPackages({ activeOnly: false }))
  }

  @Get('admin/packages/:id')
  getAdminPackage(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.getPackage(id))
  }

  @Post('admin/packages')
  createPackage(
    @Headers('x-admin-token') token: string | undefined,
    @Body()
    body: {
      slug: string
      title: string
      description?: string
      rating?: string
      topic?: string
      isActive?: boolean
      sortOrder?: number
    },
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.createPackage(body))
  }

  @Patch('admin/packages/:id')
  updatePackage(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string
      description?: string
      rating?: string
      topic?: string
      isActive?: boolean
      sortOrder?: number
      slug?: string
    },
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.updatePackage(id, body))
  }

  @Delete('admin/packages/:id')
  deletePackage(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.deletePackage(id))
  }

  @Post('admin/packages/:id/disasters')
  createDisaster(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') packageId: string,
    @Body() body: { title: string; description: string; isActive?: boolean },
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.createDisaster(packageId, body))
  }

  @Patch('admin/disasters/:id')
  updateDisaster(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; isActive?: boolean },
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.updateDisaster(id, body))
  }

  @Delete('admin/disasters/:id')
  deleteDisaster(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.deleteDisaster(id))
  }

  @Post('admin/packages/:id/bunkers')
  createBunker(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') packageId: string,
    @Body() body: { title: string; description: string; isActive?: boolean },
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.createBunker(packageId, body))
  }

  @Patch('admin/bunkers/:id')
  updateBunker(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; isActive?: boolean },
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.updateBunker(id, body))
  }

  @Delete('admin/bunkers/:id')
  deleteBunker(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.deleteBunker(id))
  }

  @Post('admin/packages/:id/characteristics')
  createCharacteristic(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') packageId: string,
    @Body()
    body: {
      category: string
      title: string
      description?: string | null
      isActive?: boolean
    },
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.createCharacteristic(packageId, body))
  }

  @Patch('admin/characteristics/:id')
  updateCharacteristic(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
    @Body()
    body: {
      category?: string
      title?: string
      description?: string | null
      isActive?: boolean
    },
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.updateCharacteristic(id, body))
  }

  @Delete('admin/characteristics/:id')
  deleteCharacteristic(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
  ) {
    this.assertAdmin(token)
    return this.wrap(() => this.content.deleteCharacteristic(id))
  }
}
