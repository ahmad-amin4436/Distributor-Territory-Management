export type LatLng = [number, number];

export type PerformanceStatus = "excellent" | "good" | "average" | "underperforming";

export type DistributorStatus = "active" | "inactive" | "pending";

export type BaseLayerId = "dark" | "streets" | "satellite";

export interface MapFilters {
  query: string;
  performances: PerformanceStatus[];
  assignmentMode: "all" | "assigned" | "unassigned";
}

export interface Distributor {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  joinedAt: string;
  status: DistributorStatus;
  assignedTerritoryId?: string;
  avatarColor: string;
}

export interface Territory {
  id: string;
  name: string;
  coverageArea: string;
  notes?: string;
  color: string;
  coordinates: LatLng[];
  distributorId?: string;
  createdAt: string;
  monthlySales: number;
  targetSales: number;
  performance: PerformanceStatus;
  outlets: number;
  population: number;
}

export interface SalesPoint {
  id: string;
  lat: number;
  lng: number;
  intensity: number; // 0-100
  amount: number;
  territoryId?: string;
  label?: string;
  createdAt?: string;
}

export interface HeatmapSettings {
  radiusScale: number; // 0.4 - 2
  opacity: number; // 0.1 - 1
  highThreshold: number; // 0-100
  mediumThreshold: number; // 0-100
  showTerritories: boolean;
  territoryFilter: string | null;
}

export interface MonthlyTrendPoint {
  month: string;
  sales: number;
  target: number;
  orders: number;
}

export interface SessionUser {
  email: string;
  name: string;
  role: string;
}
