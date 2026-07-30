'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  adminCreatePackage,
  adminDeletePackage,
  adminListPackages,
  adminUpdatePackage,
} from '@/features/admin/actions/admin-api'
import { ensureBrowserAuth } from '@/lib/api/client'
import type { ContentPackageSummary } from '@/lib/api/types'

const TOKEN_KEY = 'shelter_admin_token'

const RATING_LABELS: Record<string, string> = {
  everyone: '0+',
  teen: '13+',
  mature: '16+',
  explicit: '18+',
}

type CreateForm = {
  title: string
  slug: string
  description: string
  rating: string
  topic: string
}

export function AdminPackagesPanel() {
  const [token, setToken] = useState('')
  const [savedToken, setSavedToken] = useState('')
  const [packages, setPackages] = useState<ContentPackageSummary[]>([])
  const [pending, startTransition] = useTransition()

  const form = useForm<CreateForm>({
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      rating: 'everyone',
      topic: 'custom',
    },
  })

  useEffect(() => {
    const existing = window.localStorage.getItem(TOKEN_KEY) ?? ''
    setToken(existing)
    setSavedToken(existing)
  }, [])

  function unlock() {
    window.localStorage.setItem(TOKEN_KEY, token.trim())
    setSavedToken(token.trim())
    toast.success('Токен сохранён')
    void reload(token.trim())
  }

  async function reload(activeToken = savedToken) {
    if (!activeToken) return
    await ensureBrowserAuth()
    const result = await adminListPackages(activeToken)
    if (!result.ok) {
      toast.error(result.error ?? 'Не удалось загрузить пакеты')
      return
    }
    setPackages(result.data ?? [])
  }

  useEffect(() => {
    if (savedToken) void reload(savedToken)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedToken])

  function onCreate(values: CreateForm) {
    startTransition(async () => {
      const result = await adminCreatePackage(savedToken, {
        title: values.title,
        slug: values.slug || values.title,
        description: values.description,
        rating: values.rating,
        topic: values.topic,
      })
      if (!result.ok) {
        toast.error(result.error ?? 'Ошибка создания')
        return
      }
      toast.success('Пакет создан')
      form.reset({
        title: '',
        slug: '',
        description: '',
        rating: 'everyone',
        topic: 'custom',
      })
      await reload()
    })
  }

  function toggleActive(pack: ContentPackageSummary) {
    startTransition(async () => {
      const result = await adminUpdatePackage(savedToken, pack.id, {
        isActive: !pack.is_active,
      })
      if (!result.ok) toast.error(result.error ?? 'Ошибка')
      else await reload()
    })
  }

  function remove(pack: ContentPackageSummary) {
    if (pack.is_builtin) {
      toast.error('Встроенный пакет нельзя удалить')
      return
    }
    if (!window.confirm(`Удалить пакет «${pack.title}» со всем контентом?`)) return
    startTransition(async () => {
      const result = await adminDeletePackage(savedToken, pack.id)
      if (!result.ok) toast.error(result.error ?? 'Ошибка удаления')
      else {
        toast.success('Удалено')
        await reload()
      }
    })
  }

  if (!savedToken) {
    return (
      <Card className="mx-auto max-w-lg border-border/60">
        <CardHeader>
          <CardTitle>Админка контента</CardTitle>
          <CardDescription>
            Введите ADMIN_TOKEN из окружения API (заголовок X-Admin-Token).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN"
          />
          <Button type="button" onClick={unlock} disabled={!token.trim()}>
            Войти
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl text-stone-50">Пакеты контента</h1>
          <p className="mt-1 text-sm text-stone-400">
            Темы, цензура, катастрофы, бункеры и характеристики.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.localStorage.removeItem(TOKEN_KEY)
            setSavedToken('')
            setToken('')
          }}
        >
          Выйти
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Новый пакет</CardTitle>
          <CardDescription>Свой набор под мем / 18+ / кастомную тему.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onCreate)} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Название</FieldLabel>
                <Input {...form.register('title', { required: true })} disabled={pending} />
                <FieldError>{form.formState.errors.title?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Slug</FieldLabel>
                <Input {...form.register('slug')} placeholder="auto из названия" disabled={pending} />
              </Field>
              <Field>
                <FieldLabel>Тема</FieldLabel>
                <Input {...form.register('topic')} disabled={pending} />
              </Field>
              <Field>
                <FieldLabel>Рейтинг</FieldLabel>
                <select
                  className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                  {...form.register('rating')}
                  disabled={pending}
                >
                  <option value="everyone">0+ everyone</option>
                  <option value="teen">13+ teen</option>
                  <option value="mature">16+ mature</option>
                  <option value="explicit">18+ explicit</option>
                </select>
              </Field>
              <Field>
                <FieldLabel>Описание</FieldLabel>
                <Textarea {...form.register('description')} disabled={pending} />
              </Field>
              <Button type="submit" disabled={pending}>
                Создать пакет
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Список</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пакет</TableHead>
                <TableHead>Рейтинг</TableHead>
                <TableHead>Контент</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pack) => (
                <TableRow key={pack.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Link
                        href={`/admin/packages/${pack.id}`}
                        className="font-medium text-amber-100 hover:underline"
                      >
                        {pack.title}
                      </Link>
                      <span className="text-xs text-stone-500">
                        {pack.slug} · {pack.topic}
                        {pack.is_builtin ? ' · builtin' : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {RATING_LABELS[pack.rating] ?? pack.rating}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-stone-400">
                    {pack.counts
                      ? `${pack.counts.disasters} кат. · ${pack.counts.bunkers} бунк. · ${pack.counts.characteristics} черт`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {pack.is_active ? (
                      <Badge>активен</Badge>
                    ) : (
                      <Badge variant="outline">выкл</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => toggleActive(pack)}
                      >
                        {pack.is_active ? 'Выкл' : 'Вкл'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={pending || pack.is_builtin}
                        onClick={() => remove(pack)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
