import { addDays, endOfDay, startOfDay } from "date-fns";
import { listSessionsForRange } from "@/lib/data/sessions";
import { listDogsForQuickCreate } from "@/lib/data/dogs";
import { listClientsForQuickCreate } from "@/lib/data/clients";
import { listTrainersForQuickCreate } from "@/lib/data/settings";
import SessionsPage from "./page-client";

export default async function SessionsPageWrapper() {
  const today = new Date();
  const rangeStart = startOfDay(today);
  const rangeEnd = endOfDay(addDays(rangeStart, 30)); // Show last 30 days for archived

  const [sessions, dogOptions, clientOptions, trainerOptions] = await Promise.all([
    listSessionsForRange(rangeStart.toISOString(), rangeEnd.toISOString()),
    listDogsForQuickCreate(),
    listClientsForQuickCreate(),
    listTrainersForQuickCreate(),
  ]);

  return (
    <SessionsPage
      initialSessions={sessions}
      dogOptions={dogOptions}
      clientOptions={clientOptions}
      trainerOptions={trainerOptions}
    />
  );
}

