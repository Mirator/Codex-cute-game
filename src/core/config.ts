import categories from '../../data/categories.json';
import scoring from '../../data/scoring.json';
import heat from '../../data/heat.json';

export type CategoriesConfig = typeof categories;
export type ScoringConfig = typeof scoring;
export type HeatConfig = typeof heat;

export interface GameConfig {
  categories: CategoriesConfig;
  scoring: ScoringConfig;
  heat: HeatConfig;
}

export const CONFIG: GameConfig = {
  categories,
  scoring,
  heat,
};
