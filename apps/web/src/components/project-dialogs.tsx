import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState, type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { FieldError, Input, Label, Textarea } from '@/components/ui/input'
import { errorMessage } from '@/lib/utils'
import { createProject, deleteProject, updateProject } from '@/server/projects'

const schema = z.object({
  name: z.string().trim().min(1, 'projects.validation.name').max(80, 'validation.max80'),
  description: z.string().max(280, 'validation.max280'),
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
  const { t } = useTranslation()
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
          toast.success(t('projects.updated'))
        } else {
          const { id } = await create({ data: value })
          await navigate({ to: '/proyectos/$projectId', params: { projectId: id } })
        }
        await queryClient.invalidateQueries({ queryKey: ['projects'] })
        if (project) await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
        setOpen(false)
      } catch (error) {
        toast.error(errorMessage(error, t('common.genericError')))
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
        title={project ? t('projects.edit') : t('projects.new')}
        description={project ? undefined : t('projects.newDescription')}
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
                <Label htmlFor="project-name">{t('fields.name')}</Label>
                <Input
                  id="project-name"
                  autoFocus
                  placeholder={t('projects.namePlaceholder')}
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
                  {t('fields.description')} <span className="font-normal text-muted">{t('common.optional')}</span>
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
              <Button type="button">{t('common.cancel')}</Button>
            </DialogClose>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" variant="primary" disabled={submitting}>
                  {project ? t('common.save') : t('projects.create')}
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
  const { t } = useTranslation()
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
      toast.success(t('projects.deleted', { name: project.name }))
    },
    onError: (error) => toast.error(errorMessage(error, t('common.genericError'))),
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
        title={t('projects.delete')}
        description={
          <Trans
            i18nKey="projects.deleteDescription"
            values={{ name: project.name }}
            components={{ b: <b className="font-mono text-ink" /> }}
          />
        }
      >
        <Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} aria-label={t('projects.nameLabel')} autoFocus />
        <div className="mt-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button>{t('common.cancel')}</Button>
          </DialogClose>
          <Button
            variant="danger"
            disabled={confirmation !== project.name || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {t('projects.delete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
