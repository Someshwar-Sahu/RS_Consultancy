import { db } from "./db";

/**
 * Assigns an application to an active employee using a round-robin / load-balancing strategy.
 * If no employees exist, assigns to an admin.
 */
export async function assignApplicationRoundRobin(): Promise<string | null> {
  try {
    // 1. Find all active employees
    const employees = await db.user.findMany({
      where: {
        role: "EMPLOYEE",
        isActive: true,
      },
      select: { id: true },
    });

    const candidateUsers = employees.length > 0
      ? employees
      : await db.user.findMany({
          where: { role: "ADMIN", isActive: true },
          select: { id: true },
        });

    if (candidateUsers.length === 0) {
      return null;
    }

    // 2. Count active assigned applications per user to pick the one with lowest load
    const userLoads = await Promise.all(
      candidateUsers.map(async (u) => {
        const count = await db.application.count({
          where: {
            assignedUserId: u.id,
            status: { in: ["Applied", "Shortlisted", "InterviewScheduled"] },
          },
        });
        return { userId: u.id, count };
      })
    );

    userLoads.sort((a, b) => a.count - b.count);
    const minCount = userLoads[0].count;
    const tiedUsers = userLoads.filter((u) => u.count === minCount);
    
    // Pick randomly among tied lowest-load users to distribute concurrent assignments evenly
    const selected = tiedUsers[Math.floor(Math.random() * tiedUsers.length)];
    return selected.userId;
  } catch (error) {
    console.error("Round Robin Assignment Error:", error);
    return null;
  }
}
