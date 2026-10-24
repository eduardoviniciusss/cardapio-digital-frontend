// Barra do Administrador: escolhe a escola (ou o responsável) em nome de quem
// ele vai trabalhar na tela atual. Aparece só para o Administrador.

import { useEffect, useState, type ChangeEvent } from 'react'
import { getAllSchools } from '@/services/schoolService'
import { getParentUsers, type ParentUser } from '@/services/actingService'
import { extractApiErrorMessage } from '@/services/authService'
import {
  getActingParent,
  getActingSchool,
  setActingParent,
  setActingSchool,
} from '@/services/acting'
import type { School } from '@/types/school'
import './ActingBar.css'

interface Props {
  scope: 'school' | 'parent'
  /** Avisa o Layout para recarregar a tela com a nova escolha */
  onChange: () => void
}

export default function ActingBar({ scope, onChange }: Props) {
  const [schools, setSchools] = useState<School[]>([])
  const [parents, setParents] = useState<ParentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    async function load() {
      try {
        if (scope === 'school') {
          const data = await getAllSchools()
          if (active) setSchools(data)
        } else {
          const data = await getParentUsers()
          if (active) setParents(data)
        }
      } catch (err) {
        if (active) setError(extractApiErrorMessage(err, 'Erro ao carregar a lista.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [scope])

  const value =
    scope === 'school'
      ? String(getActingSchool()?.id ?? '')
      : String(getActingParent()?.userId ?? '')

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const chosen = e.target.value

    if (scope === 'school') {
      const school = schools.find((s) => String(s.id) === chosen)
      setActingSchool(
        school && school.canteenUserId !== undefined
          ? { id: school.id, name: school.name, canteenUserId: school.canteenUserId }
          : null,
      )
    } else {
      const parent = parents.find((p) => String(p.userId) === chosen)
      setActingParent(parent ? { userId: parent.userId, name: parent.name } : null)
    }
    onChange()
  }

  const isSchool = scope === 'school'
  const isEmpty = isSchool ? schools.length === 0 : parents.length === 0

  return (
    <div className="acting-bar">
      <label htmlFor="acting-select">
        {isSchool ? 'Gerenciando a escola:' : 'Atuando como o responsável:'}
      </label>

      <select id="acting-select" value={value} onChange={handleChange} disabled={loading}>
        <option value="">{isSchool ? 'Selecione a escola…' : 'Selecione o responsável…'}</option>
        {isSchool
          ? schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))
          : parents.map((p) => (
              <option key={p.userId} value={p.userId}>
                {p.name} ({p.email}){p.hasRegistration ? '' : ' — cadastro pendente'}
              </option>
            ))}
      </select>

      {error && (
        <span className="acting-bar__note acting-bar__note--error" role="alert">
          {error}
        </span>
      )}
      {!loading && !error && isEmpty && (
        <span className="acting-bar__note">
          {isSchool ? 'Nenhuma escola cadastrada ainda.' : 'Nenhum responsável cadastrado ainda.'}
        </span>
      )}
    </div>
  )
}
