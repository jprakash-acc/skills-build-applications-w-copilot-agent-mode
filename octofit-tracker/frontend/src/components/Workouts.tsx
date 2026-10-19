import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason: string };

export default function Workouts() {
  return <CapabilityCard<Suggestion> title="Workout suggestions" description="Recommend workouts from activity patterns." path="/api/workouts/suggestions/mona%40example.com" itemsKey="suggestions" emptyMessage="No workout suggestions yet." renderItem={(suggestion) => `${suggestion.title}: ${suggestion.reason}`} />;
}
