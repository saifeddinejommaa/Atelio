import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLoaderData } from 'react-router'
import type { Deferred } from '../lib/deferred'
import LoadingState from './LoadingState'

const DeferredData = createContext<unknown>(undefined)

/** Données de la route, une fois chargées (dans une page enveloppée par DeferredRoute). */
export function useDeferredData<T>(): T {
  return useContext(DeferredData) as T
}

export type DeferredResult<T> = { status: 'loading' } | { status: 'ok'; value: T } | { status: 'error'; error: unknown }

type Settled = { data: Promise<unknown>; result: DeferredResult<unknown> }

/** État des données d'un loader enveloppé par deferred() : en chargement, chargées ou en erreur. */
export function useDeferredResult<T>(loaded: Deferred<T>): DeferredResult<T> {
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    if (loaded.loaded) return
    let active = true
    loaded.data.then(
      (value) => active && setSettled({ data: loaded.data, result: { status: 'ok', value } }),
      (error: unknown) => active && setSettled({ data: loaded.data, result: { status: 'error', error } }),
    )
    return () => {
      active = false
    }
  }, [loaded])

  if (loaded.loaded) return { status: 'ok', value: loaded.value as T }
  return settled?.data === loaded.data ? (settled.result as DeferredResult<T>) : { status: 'loading' }
}

/**
 * Page dont le loader est enveloppé par deferred() : affiche tout de suite le titre et le chargement,
 * puis la page avec ses données. Une erreur (ex. 404) remonte à la page d'erreur de la route.
 */
export default function DeferredRoute({ title, message, children }: { title: string; message: string; children: ReactNode }) {
  const result = useDeferredResult(useLoaderData<Deferred<unknown>>())

  if (result.status === 'error') throw result.error

  if (result.status === 'loading') {
    return (
      <>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <LoadingState message={message} />
      </>
    )
  }

  return <DeferredData value={result.value}>{children}</DeferredData>
}
