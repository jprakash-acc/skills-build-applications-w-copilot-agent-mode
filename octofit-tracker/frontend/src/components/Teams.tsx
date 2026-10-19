import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { name: string };

function loadTeams() {
  return getJson<{ teams: Team[] }>('/api/teams').then((result) => result.teams);
}

export default function Teams() {
  return <CapabilityCard<Team> title="Teams" description="Manage teams and members." loadItems={loadTeams} emptyMessage="No teams yet." renderItem={(team) => team.name} />;
}
