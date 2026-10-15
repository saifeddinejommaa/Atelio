/** Article du catalogue de la marque : opérations décrites et prix HT, importé sur les interventions. */
export type Article = {
  id: number;
  name: string;
  /** Opérations réalisées, une par ligne (ex. « - Changement du filtre à huile »). */
  description: string | null;
  unitPriceHt: number;
  /** Désactivé : ne se propose plus sur les interventions. */
  isActive: boolean;
};

/** Article à enregistrer. */
export type ArticleInput = Pick<Article, "name" | "description" | "unitPriceHt">;

export type ArticleFilter = {
  /** Partie du nom. */
  search?: string;
  /** true : actifs, false : désactivés, absent : tous. */
  active?: boolean;
};
