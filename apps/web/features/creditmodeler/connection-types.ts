export type ConnectionDriver = "sqlite";

export type DatabaseOption = {
  value: string;
  label: string;
};

export type DatabaseOptionsResponse = {
  databases: DatabaseOption[];
};

export type SavedConnection = {
  id: string;
  label: string;
  driver: ConnectionDriver;
  database_path: string;
  created_at: string;
  updated_at: string;
  last_tested_at: string | null;
};

export type SavedConnectionsResponse = {
  connections: SavedConnection[];
};

export type ConnectionCreatePayload = {
  label: string;
  driver: ConnectionDriver;
  database_path: string;
};

export type ConnectionUpdatePayload = {
  driver: ConnectionDriver;
  database_path: string;
};

export type ConnectionTestPayload = {
  driver: ConnectionDriver;
  database_path: string;
};

export type ConnectionTestResult = {
  ok: boolean;
  message: string;
};

export type SavedConnectionTestResult = ConnectionTestResult & {
  connection: SavedConnection;
};
