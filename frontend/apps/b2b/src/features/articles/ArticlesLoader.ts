import { ArticleApiRepository, type ApiClient } from '@atelio/core/data'
import { GetArticles, type Article } from '@atelio/core/domain'

/** Tout le catalogue (actifs et désactivés) : la page filtre elle-même. */
export function articlesLoader(api: ApiClient) {
  return (): Promise<Article[]> => new GetArticles(new ArticleApiRepository(api)).execute()
}
