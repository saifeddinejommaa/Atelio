import type { Article, ArticleFilter, ArticleInput } from "../entities/Article";

export interface IArticleRepository {
  /** Articles par nom. */
  getArticles(filter: ArticleFilter): Promise<Article[]>;
  /** Ajoute un article et renvoie son identifiant. */
  create(article: ArticleInput): Promise<number>;
  update(articleId: number, article: ArticleInput): Promise<void>;
  setActive(articleId: number, isActive: boolean): Promise<void>;
}
