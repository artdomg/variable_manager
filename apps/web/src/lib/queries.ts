import { queryOptions } from '@tanstack/react-query'
import { getEntity, getProject, getResolvedProject, getSearchIndex, listProjects } from '@/server/projects'
import { getSession } from '@/server/session'

export const sessionQuery = () =>
  queryOptions({ queryKey: ['session'], queryFn: () => getSession(), staleTime: 60_000 })

export const projectsQuery = () => queryOptions({ queryKey: ['projects'], queryFn: () => listProjects() })

export const projectQuery = (projectId: string) =>
  queryOptions({ queryKey: ['project', projectId], queryFn: () => getProject({ data: { projectId } }) })

export const entityQuery = (entityId: string) =>
  queryOptions({ queryKey: ['entity', entityId], queryFn: () => getEntity({ data: { entityId } }) })

export const resolvedProjectQuery = (projectId: string) =>
  queryOptions({
    queryKey: ['project', projectId, 'resolved'],
    queryFn: () => getResolvedProject({ data: { projectId } }),
  })

/** Under the `projects` key so every mutation that refreshes projects refreshes search too. */
export const searchIndexQuery = () =>
  queryOptions({ queryKey: ['projects', 'search-index'], queryFn: () => getSearchIndex() })
