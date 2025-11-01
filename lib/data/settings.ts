import { settingsSnapshot, users } from "../mock-data";
import type { User } from "../types";

export function listUsers(): User[] {
  return users.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function getAvailabilitySettings() {
  return {
    travelBufferMinutes: settingsSnapshot.travelBufferMinutes,
    availability: settingsSnapshot.availability,
  };
}
