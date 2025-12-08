export interface Pharmacy {
  id: number;
  name: string;
  address: string;
}

export const PHARMACIES: Pharmacy[] = [
  { id: 1, name: "Sodhi Medicose", address: "Model Town, Jalandhar, PB" },
  { id: 2, name: "Jalandhar Pharmacy", address: "Cool Road, Jalandhar, PB" },
  { id: 3, name: "Public Chemist", address: "Jyoti Chowk, Jalandhar, PB" },
  { id: 4, name: "Ludhiana Meds", address: "Ferozepur Road, Ludhiana, PB" },
  { id: 5, name: "Kapurthala Drug House", address: "Sultanpur Road, Kapurthala, PB" }
];
