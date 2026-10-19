import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; reason: string };

function loadSuggestions() {
  return getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona%40example.com').then((result) => result.suggestions);
}

export default function Workouts() {
  return <CapabilityCard<Suggestion> title="Workout suggestions" description="Recommend workouts from activity patterns." loadItems={loadSuggestions} emptyMessage="No workout suggestions yet." renderItem={(suggestion) => `${suggestion.title}: ${suggestion.reason}`} />;
}
