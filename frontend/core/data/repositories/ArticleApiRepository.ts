import type { Article, ArticleFilter, ArticleInput, IArticleRepository } from "../../domain";
import { ApiError, type ApiClient } from "../http/ApiClient";

/** Élément de GET /api/articles (même forme que l'entité). */
export type ArticleDto = Article;

export class ArticleApiRepository implements IArticleRepository {
  constructor(private readonly api: ApiClient) {}

  async getArticles(filter: ArticleFilter): Promise<Article[]> {
    const articles = await this.api.get<ArticleDto[]>("/articles", { search: filter.search, active: filter.active });
    return (articles ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      unitPriceHt: a.unitPriceHt,
      isActive: a.isActive,
    }));
  }

  async create(article: ArticleInput): Promise<number> {
    const created = await this.api.post<{ id: number }>("/articles", article);
    if (!created) throw new ApiError(500, "L'API n'a pas renvoyé l'article ajouté.");
    return created.id;
  }

  async update(articleId: number, article: ArticleInput): Promise<void> {
    await this.api.put(`/articles/${articleId}`, article);
  }

  async setActive(articleId: number, isActive: boolean): Promise<void> {
    await this.api.put(`/articles/${articleId}/active`, { isActive });
  }
}
