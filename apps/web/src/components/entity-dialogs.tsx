import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { isValidEntityName } from '@vm/core'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { TintSwatch } from '@/components/tint'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { FieldError, Input, Label, Textarea } from '@/components/ui/input'
import { plural } from '@/lib/format'
import { errorMessage } from '@/lib/utils'
import { createEntity, deleteEntity, updateEntity } from '@/server/projects'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ponle un nombre a la entidad')
    .max(48, 'Máximo 48 caracteres')
    .refine(isValidEntityName, 'Solo letras, números, «-» y «_»; empieza por letra o número'),
  description: z.string().max(280, 'Máximo 280 caracteres'),
})

/** Replaces spaces as you type, so the name is always usable in references. */
const slugify = (value: string) => value.replace(/\s+/g, '-')

export function EntityDialog({
  projectId,
  entity,
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  projectId: string
  entity?: { id: string; name: string; description: string }
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const create = useServerFn(createEntity)
  const update = useServerFn(updateEntity)

  const form = useForm({
    defaultValues: { name: entity?.name ?? '', description: entity?.description ?? '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        if (entity) {
          const { rewritten } = await update({ data: { entityId: entity.id, ...value } })
          toast.success(
            rewritten
              ? `Entidad actualizada · ${plural(rewritten, 'variable reescrita', 'variables reescritas')} con el nuevo nombre`
              : 'Entidad actualizada',
          )
          await queryClient.invalidateQueries({ queryKey: ['entity'] })
        } else {
          const { id } = await create({ data: { projectId, ...value } })
          await navigate({
            to: '/proyectos/$projectId/$entityId',
            params: { projectId, entityId: id },
            search: { vista: 'variables' },
          })
        }
        await queryClient.invalidateQueries({ queryKey: ['project', projectId] })
        await queryClient.invalidateQueries({ queryKey: ['projects'] })
        setOpen(false)
      } catch (error) {
        toast.error(errorMessage(error))
      }
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) form.reset()
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        title={entity ? 'Editar entidad' : 'Nueva entidad'}
        description={
          entity
            ? 'Si cambias el nombre, las referencias a esta entidad en el proyecto se reescriben solas.'
            : 'Una entidad es un servicio, app o recurso con su propio conjunto de variables.'
        }
      >
        <form
          className="grid gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
        >
          <form.Field name="name">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor="entity-name">Nombre</Label>
                <Input
                  id="entity-name"
                  autoFocus
                  placeholder="postgres"
                  className="font-mono"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(slugify(e.target.value))}
                  aria-invalid={field.state.meta.errors.length > 0}
                  spellCheck={false}
                  autoCapitalize="off"
                />
                <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
                <form.Subscribe selector={(s) => s.values.name}>
                  {(name) => (
                    <p className="font-mono text-[11.5px] text-muted">
                      Se referencia como {'${{'}
                      <span className="text-tint">{name || 'nombre'}</span>
                      {'.VARIABLE}}'}
                    </p>
                  )}
                </form.Subscribe>
              </div>
            )}
          </form.Field>
          <form.Field name="description">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor="entity-description">
                  Descripción <span className="font-normal text-muted">(opcional)</span>
                </Label>
                <Textarea
                  id="entity-description"
                  rows={2}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
              </div>
            )}
          </form.Field>
          <div className="mt-1 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button">Cancelar</Button>
            </DialogClose>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" variant="primary" disabled={submitting}>
                  {entity ? 'Guardar' : 'Crear entidad'}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteEntityDialog({
  entity,
  dependants,
  open,
  onOpenChange,
}: {
  entity: { id: string; projectId: string; name: string; tint: number }
  dependants: { entity: string; key: string }[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const remove = useServerFn(deleteEntity)
  const mutation = useMutation({
    mutationFn: () => remove({ data: { entityId: entity.id } }),
    onSuccess: async () => {
      onOpenChange(false)
      await navigate({ to: '/proyectos/$projectId', params: { projectId: entity.projectId } })
      queryClient.removeQueries({ queryKey: ['entity', entity.id] })
      await queryClient.invalidateQueries({ queryKey: ['project', entity.projectId] })
      await queryClient.invalidateQueries({ queryKey: ['entity'] })
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(`Entidad «${entity.name}» eliminada`)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Eliminar «${entity.name}»`}
        description="Se eliminarán la entidad y todas sus variables. No se puede deshacer."
      >
        {dependants.length > 0 && (
          <div className="mb-4 border border-danger/40 bg-danger-soft p-3 text-[13px] text-danger">
            <p className="font-semibold">
              {plural(dependants.length, 'variable de otra entidad dejará', 'variables de otras entidades dejarán')} de
              resolverse:
            </p>
            <ul className="mt-2 grid gap-1 font-mono text-[12px]">
              {dependants.slice(0, 8).map((d) => (
                <li key={`${d.entity}.${d.key}`}>
                  {d.entity}.{d.key}
                </li>
              ))}
              {dependants.length > 8 && <li>y {dependants.length - 8} más…</li>}
            </ul>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 font-mono text-[13px] text-ink">
            <TintSwatch tint={entity.tint} />
            {entity.name}
          </span>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button>Cancelar</Button>
            </DialogClose>
            <Button variant="danger" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              Eliminar entidad
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
