/* Home EV charging data — generated from the charging logs:
 *   goals/home-ev-charging-cost-log/files/charging-log-sep-2026.md
 *   goals/home-ev-charging-cost-log/files/charging-log-oct-2026.md
 * Rate: $0.24/kWh effective (off-peak $0.34 minus ~32% CARE discount + taxes).
 * Battery: 96 kWh (Mercedes EQE), charge target 90%.
 *
 * startPct/endPct are null where the log does not record battery percentages
 * (all October sessions log charger times instead; 2026-09-28 records neither).
 * Regenerate this module whenever a new session is reported. */

export const EV_DATA = {
  updatedAt: "2026-10-18",
  ratePerKwh: 0.24,
  currency: "USD",
  dashboardUrl: "https://truongid.com/ev-t8k2x7m4q9/",
  sessions: [
    { date: "2026-09-20", startPct: 44, endPct: 90, kwh: 44.16, cost: 10.60 },
    { date: "2026-09-22", startPct: 51, endPct: 90, kwh: 37.44, cost: 8.99 },
    { date: "2026-09-25", startPct: 51, endPct: 90, kwh: 39.80, cost: 9.55 },
    { date: "2026-09-28", startPct: null, endPct: null, kwh: 43.80, cost: 10.51 },
    { date: "2026-10-03", startPct: null, endPct: null, kwh: 73.40, cost: 17.62 },
    { date: "2026-10-06", startPct: null, endPct: null, kwh: 60.40, cost: 14.50 },
    { date: "2026-10-06", startPct: null, endPct: null, kwh: 3.20, cost: 0.77 },
    { date: "2026-10-07", startPct: null, endPct: null, kwh: 33.20, cost: 7.97 },
    { date: "2026-10-08", startPct: null, endPct: null, kwh: 44.10, cost: 10.58 },
    { date: "2026-10-11", startPct: null, endPct: null, kwh: 49.90, cost: 11.98 },
    { date: "2026-10-13", startPct: null, endPct: null, kwh: 12.20, cost: 2.93 },
    { date: "2026-10-14", startPct: null, endPct: null, kwh: 46.20, cost: 11.09 },
    { date: "2026-10-18", startPct: null, endPct: null, kwh: 47.80, cost: 11.47 }
  ],
  totals: {
    september: { kwh: 165.20, cost: 39.65, sessions: 4 },
    october: { kwh: 370.40, cost: 88.91, sessions: 9 },
    allTime: { kwh: 535.60, cost: 128.56, sessions: 13 }
  },
  currentWeek: { isoWeek: "2026-W42", kwh: 106.20, cost: 25.49, sessions: 3 }
};
