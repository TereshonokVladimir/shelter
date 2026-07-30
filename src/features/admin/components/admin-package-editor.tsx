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
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CHARACTERISTIC_CATEGORIES, CATEGORY_LABELS } from '@/lib/constants'
import {
  adminCreateBunker,
  adminCreateCharacteristic,
  adminCreateDisaster,
  adminDeleteBunker,
  adminDeleteCharacteristic,
  adminDeleteDisaster,
  adminGetPackage,
} from '@/features/admin/actions/admin-api'
import { ensureBrowserAuth } from '@/lib/api/client'
import type { ContentPackageDetail } from '@/lib/api/types'

const TOKEN_KEY = 'shelter_admin_token'

interface AdminPackageEditorProps {
  packageId: string
}

export function AdminPackageEditor({ packageId }: AdminPackageEditorProps) {
  const [token, setToken] = useState('')
  const [pack, setPack] = useState<ContentPackageDetail | null>(null)
  const [pending, startTransition] = useTransition()

  const disasterForm = useForm({ defaultValues: { title: '', description: '' } })
  const bunkerForm = useForm({ defaultValues: { title: '', description: '' } })
  const charForm = useForm({
    defaultValues: { category: 'profession', title: '', description: '' },
  })

  async function reload(activeToken: string) {
    await ensureBrowserAuth()
    const result = await adminGetPackage(activeToken, packageId)
    if (!result.ok) {
      toast.error(result.error ?? 'Не удалось загрузить пакет')
      return
    }
    setPack(result.data ?? null)
  }

  useEffect(() => {
    const existing = window.localStorage.getItem(TOKEN_KEY) ?? ''
    setToken(existing)
    if (existing) void reload(existing)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId])

  if (!token) {
    return (
      <p className="p-8 text-sm text-stone-400">
        Сначала войдите в{' '}
        <Link href="/admin" className="text-amber-200 underline">
          /admin
        </Link>
      </p>
    )
  }

  if (!pack) {
    return <p className="p-8 text-sm text-stone-400">Загрузка…</p>
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-300">
          ← К пакетам
        </Link>
        <h1 className="mt-2 text-3xl text-stone-50">{pack.title}</h1>
        <p className="mt-1 text-sm text-stone-400">
          {pack.slug} · {pack.rating} · {pack.topic}
        </p>
      </div>

      <Tabs defaultValue="disasters">
        <TabsList>
          <TabsTrigger value="disasters">Катастрофы ({pack.disasters.length})</TabsTrigger>
          <TabsTrigger value="bunkers">Бункеры ({pack.bunkers.length})</TabsTrigger>
          <TabsTrigger value="traits">Черты ({pack.characteristics.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="disasters" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Добавить катастрофу</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-4"
                onSubmit={disasterForm.handleSubmit((values) => {
                  startTransition(async () => {
                    const result = await adminCreateDisaster(token, packageId, values)
                    if (!result.ok) toast.error(result.error ?? 'Ошибка')
                    else {
                      disasterForm.reset()
                      await reload(token)
                    }
                  })
                })}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel>Название</FieldLabel>
                    <Input {...disasterForm.register('title', { required: true })} />
                  </Field>
                  <Field>
                    <FieldLabel>Описание</FieldLabel>
                    <Textarea {...disasterForm.register('description', { required: true })} />
                  </Field>
                  <Button type="submit" disabled={pending}>
                    Добавить
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <ul className="flex flex-col gap-2">
            {pack.disasters.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-stone-100">{item.title}</p>
                  <p className="text-xs text-stone-500">{item.description}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await adminDeleteDisaster(token, item.id)
                      await reload(token)
                    })
                  }}
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="bunkers" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Добавить бункер</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-4"
                onSubmit={bunkerForm.handleSubmit((values) => {
                  startTransition(async () => {
                    const result = await adminCreateBunker(token, packageId, values)
                    if (!result.ok) toast.error(result.error ?? 'Ошибка')
                    else {
                      bunkerForm.reset()
                      await reload(token)
                    }
                  })
                })}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel>Название</FieldLabel>
                    <Input {...bunkerForm.register('title', { required: true })} />
                  </Field>
                  <Field>
                    <FieldLabel>Описание</FieldLabel>
                    <Textarea {...bunkerForm.register('description', { required: true })} />
                  </Field>
                  <Button type="submit" disabled={pending}>
                    Добавить
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <ul className="flex flex-col gap-2">
            {pack.bunkers.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-stone-100">{item.title}</p>
                  <p className="text-xs text-stone-500">{item.description}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await adminDeleteBunker(token, item.id)
                      await reload(token)
                    })
                  }}
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="traits" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Добавить характеристику</CardTitle>
              <CardDescription>Категории персонажа в этом пакете.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-4"
                onSubmit={charForm.handleSubmit((values) => {
                  startTransition(async () => {
                    const result = await adminCreateCharacteristic(token, packageId, {
                      category: values.category,
                      title: values.title,
                      description: values.description || undefined,
                    })
                    if (!result.ok) toast.error(result.error ?? 'Ошибка')
                    else {
                      charForm.reset({
                        category: values.category,
                        title: '',
                        description: '',
                      })
                      await reload(token)
                    }
                  })
                })}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel>Категория</FieldLabel>
                    <select
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                      {...charForm.register('category')}
                    >
                      {CHARACTERISTIC_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {CATEGORY_LABELS[category]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel>Название</FieldLabel>
                    <Input {...charForm.register('title', { required: true })} />
                  </Field>
                  <Field>
                    <FieldLabel>Описание (опционально)</FieldLabel>
                    <Textarea {...charForm.register('description')} />
                  </Field>
                  <Button type="submit" disabled={pending}>
                    Добавить
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <ul className="flex flex-col gap-2">
            {pack.characteristics.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/40 px-3 py-2"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-stone-500">
                    {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ??
                      item.category}
                  </p>
                  <p className="text-sm text-stone-100">{item.title}</p>
                  {item.description ? (
                    <p className="text-xs text-stone-500">{item.description}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await adminDeleteCharacteristic(token, item.id)
                      await reload(token)
                    })
                  }}
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  )
}
