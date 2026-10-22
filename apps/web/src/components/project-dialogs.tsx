import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { FieldError, Input, Label, Textarea } from '@/components/ui/input'
import { errorMessage } from '@/lib/utils'
import { createProject, deleteProject, updateProject } from '@/server/projects'

const schema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre al proyecto').max(80, 'Máximo 80 caracteres'),
  description: z.string().max(280, 'Máximo 280 caracteres'),
})

export function ProjectDialog({
  project,
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  project?: { id: string; name: string; description: string }
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const create = useServerFn(createProject)
  const update = useServerFn(updateProject)

  const form = useForm({
    defaultValues: { name: project?.name ?? '', description: project?.description ?? '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        if (project) {
          await update({ data: { projectId: project.id, ...value } })
          toast.success('Proyecto actualizado')
        } else {
          const { id } = await create({ data: value })
          await navigate({ to: '/proyectos/$projectId', params: { projectId: id } })
        }
        await queryClient.invalidateQueries({ queryKey: ['projects'] })
        if (project) await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
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
        title={project ? 'Editar proyecto' : 'Nuevo proyecto'}
        description={project ? undefined : 'Un proyecto agrupa las entidades (servicios, bases de datos…) que comparten variables.'}
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
                <Label htmlFor="project-name">Nombre</Label>
                <Input
                  id="project-name"
                  autoFocus
                  placeholder="tienda-online"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
              </div>
            )}
          </form.Field>
          <form.Field name="description">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor="project-description">
                  Descripción <span className="font-normal text-muted">(opcional)</span>
                </Label>
                <Textarea
                  id="project-description"
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
                  {project ? 'Guardar' : 'Crear proyecto'}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: { id: string; name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const remove = useServerFn(deleteProject)
  const [confirmation, setConfirmation] = useState('')
  const mutation = useMutation({
    mutationFn: () => remove({ data: { projectId: project.id } }),
    onSuccess: async () => {
      onOpenChange(false)
      await navigate({ to: '/proyectos' })
      queryClient.removeQueries({ queryKey: ['project', project.id] })
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(`Proyecto «${project.name}» eliminado`)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        setConfirmation('')
      }}
    >
      <DialogContent
        title="Eliminar proyecto"
        description={
          <>
            Se eliminarán todas sus entidades y variables. No se puede deshacer. Escribe{' '}
            <b className="font-mono text-ink">{project.name}</b> para confirmar.
          </>
        }
      >
        <Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} aria-label="Nombre del proyecto" autoFocus />
        <div className="mt-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button>Cancelar</Button>
          </DialogClose>
          <Button
            variant="danger"
            disabled={confirmation !== project.name || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Eliminar proyecto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
