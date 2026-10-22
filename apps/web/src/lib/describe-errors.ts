import type { EnvParseError, ReferenceError } from '@vm/core'
import { useTranslation } from 'react-i18next'

/** Words a reference resolution error from @vm/core in the active language. */
export function useDescribeReferenceError() {
  const { t } = useTranslation()
  return (error: ReferenceError) => {
    switch (error.kind) {
      case 'missing-entity':
        return error.suggestion
          ? t('references.missingEntitySuggestion', { entity: error.entity, suggestion: error.suggestion })
          : t('references.missingEntity', { entity: error.entity })
      case 'missing-variable':
        return t('references.missingVariable', { entity: error.entity, key: error.key })
      case 'cycle':
        return t('references.cycle', { path: error.cycle?.join(' → ') ?? error.target })
      case 'upstream':
        return error.cycle
          ? t('references.upstreamCycle', { target: error.target })
          : t('references.upstream', { target: error.target })
    }
  }
}

/** Words a .env / JSON parse error from @vm/core in the active language. */
export function useDescribeParseError() {
  const { t } = useTranslation()
  return (error: EnvParseError) => t(`parse.${error.code}`, { ...error.params })
}

/**
 * The `${{entity.VARIABLE}}` example in the active language. Built in code
 * because `{{ }}` is also i18next's interpolation syntax.
 */
export function useReferenceExample() {
  const { t } = useTranslation()
  return `\${{${t('references.example')}}}`
}
