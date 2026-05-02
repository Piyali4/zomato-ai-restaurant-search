import { listAreas, listCuisines, loadRestaurants } from "@/lib/data";
import RecommendApp from "@/components/RecommendApp";

export default function Home() {
  const areas = listAreas();
  const cuisines = listCuisines();
  const total = loadRestaurants().length;
  return <RecommendApp areas={areas} cuisines={cuisines} totalRestaurants={total} />;
}
