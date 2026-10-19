import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string };

export default function Teams() {
  return <CapabilityCard<Team> title="Teams" description="Manage teams and members." path="/api/teams" itemsKey="teams" emptyMessage="No teams yet." renderItem={(team) => team.name} />;
}
