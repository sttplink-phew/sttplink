export type UserRole = "driver" | "customer" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
};

export type Order = {
  id: string;
  customerId: string;
  driverId?: string;
  cargoType: "container" | "heavy-haul" | "oversized" | "construction";
  status: "pending" | "assigned" | "in-transit" | "delivered" | "cancelled";
  origin: string;
  destination: string;
  createdAt: Date;
};

export type Driver = {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleType: string;
  isVerified: boolean;
};
