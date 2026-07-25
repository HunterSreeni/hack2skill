/**
 * Real, published India helpline numbers — no placeholders.
 * Sources:
 * - National Toll-Free Drug De-Addiction Helpline (Ministry of Social Justice
 *   & Empowerment, 24x7 since 2017): https://www.pib.gov.in/newsite/PrintRelease.aspx?relid=177380
 * - Tele-MANAS (Tele Mental Health Assistance and Networking Across States,
 *   Ministry of Health & Family Welfare): https://telemanas.mohfw.gov.in
 */

export const HELPLINES = [
  {
    name: "National Toll-Free Drug De-Addiction Helpline",
    number: "1800-11-0031",
    availability: "24x7",
  },
  {
    name: "Tele-MANAS",
    number: "14416",
    altNumber: "1800-891-4416",
    availability: "24x7",
  },
] as const;
