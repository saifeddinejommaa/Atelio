import type { LoaderFunctionArgs } from 'react-router'

/**
 * Données d'une route chargées sans bloquer la navigation : la page s'ouvre tout de suite (titre, chargement)
 * et ses données arrivent ensuite. value : déjà chargées (rechargement de la page affichée).
 */
export type Deferred<T> = { data: Promise<T>; value?: T; loaded: boolean }

// Premier affichage terminé : avant, l'application entière attend (écran de démarrage).
let appReady = false

export function markAppReady() {
  appReady = true
}

/**
 * Enveloppe un loader : à la navigation, il renvoie la promesse sans l'attendre (la page affiche son chargement).
 * Au rechargement de la page affichée (même URL, ex. après un enregistrement), il attend les données :
 * la page garde les anciennes à l'écran jusqu'aux nouvelles, sans repasser par le chargement.
 */
export function deferred<T>(load: (args: LoaderFunctionArgs) => Promise<T>) {
  return async (args: LoaderFunctionArgs): Promise<Deferred<T>> => {
    const data = load(args)
    if (appReady && args.request.url === window.location.href) {
      return { data, value: await data, loaded: true }
    }
    // Erreur traitée par la page (DeferredRoute) : pas de rejet non intercepté en attendant.
    data.catch(() => {})
    return { data, loaded: false }
  }
}
