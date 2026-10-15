import type { Article, ArticleFilter, ArticleInput } from "../entities/Article";
import { ValidationError } from "../errors";
import type { IArticleRepository } from "../repositories/IArticleRepository";

/** Vérifie un article saisi et le nettoie (description facultative, prix HT). */
function checkArticle(article: ArticleInput): ArticleInput {
  const name = article.name.trim();
  if (!name) throw new ValidationError("Indiquez le nom de l'article.");
  if (!(article.unitPriceHt >= 0)) throw new ValidationError("Indiquez un prix HT valide.");
  return { name, description: article.description?.trim() || null, unitPriceHt: article.unitPriceHt };
}

export class GetArticles {
  constructor(private readonly repository: IArticleRepository) {}

  execute(filter: ArticleFilter = {}): Promise<Article[]> {
    return this.repository.getArticles(filter);
  }
}

export class CreateArticle {
  constructor(private readonly repository: IArticleRepository) {}

  async execute(article: ArticleInput): Promise<number> {
    return this.repository.create(checkArticle(article));
  }
}

/** Modifie le catalogue : les interventions déjà renseignées gardent leur copie. */
export class UpdateArticle {
  constructor(private readonly repository: IArticleRepository) {}

  async execute(articleId: number, article: ArticleInput): Promise<void> {
    return this.repository.update(articleId, checkArticle(article));
  }
}

/** Désactive (plus proposé sur les interventions) ou réactive un article. */
export class SetArticleActive {
  constructor(private readonly repository: IArticleRepository) {}

  execute(articleId: number, isActive: boolean): Promise<void> {
    return this.repository.setActive(articleId, isActive);
  }
}
