/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InheritanceInputs, CalculationResult } from "./utils/inheritanceEngine";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "SAR", symbol: "SR", name: "Saudi Riyal" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "EGP", symbol: "EGP", name: "Egyptian Pound" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SavedScenario {
  id: string;
  name: string;
  date: string;
  inputs: InheritanceInputs;
  currencyCode: string;
}
