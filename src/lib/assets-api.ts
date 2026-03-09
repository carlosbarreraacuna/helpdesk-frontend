import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssetType {
  id: number;
  name: string;
  display_name: string;
  icon: string | null;
  is_system: boolean;
  is_active: boolean;
  assets_count?: number;
  fields?: AssetTypeField[];
}

export interface AssetTypeField {
  id: number;
  asset_type_id: number;
  name: string;
  display_name: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options: string[] | null;
  is_required: boolean;
  is_identifier: boolean;
  order_index: number;
}

export interface Location {
  id: number;
  area_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  area?: { id: number; name: string };
}

export interface ServiceProvider {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  service_type: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface AssetFieldValue {
  id: number;
  asset_id: number;
  field_id: number;
  value: string | null;
  field?: AssetTypeField;
}

export type AssetStatus = 'available' | 'assigned' | 'pending_return' | 'in_repair' | 'damaged' | 'retired';

export interface Asset {
  id: number;
  asset_type_id: number;
  name: string;
  internal_code: string | null;
  serial_number: string | null;
  inventory_tag: string | null;
  status: AssetStatus;
  location_id: number | null;
  current_user_id: number | null;
  vendor: string | null;
  purchase_date: string | null;
  warranty_end_date: string | null;
  warranty_provider: string | null;
  notes: string | null;
  is_shared: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  asset_type?: AssetType;
  location?: Location;
  current_user?: { id: number; name: string; email: string };
  field_values?: AssetFieldValue[];
  active_assignment?: AssetAssignment;
  assignments_count?: number;
}

export interface AssetAssignment {
  id: number;
  asset_id: number;
  user_id: number;
  assigned_by: number;
  assigned_at: string;
  returned_at: string | null;
  reason: string | null;
  return_notes: string | null;
  is_active: boolean;
  user?: { id: number; name: string; email: string };
  assigned_by_user?: { id: number; name: string };
  asset?: Pick<Asset, 'id' | 'name' | 'internal_code' | 'serial_number' | 'asset_type'>;
}

export interface AssetEvent {
  id: number;
  asset_id: number;
  event_type: string;
  description: string;
  performed_by: number;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  performed_by_user?: { id: number; name: string };
}

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenanceType = 'preventive' | 'corrective';

export interface AssetMaintenance {
  id: number;
  asset_id: number;
  maintenance_type: MaintenanceType;
  status: MaintenanceStatus;
  description: string | null;
  service_provider_id: number | null;
  scheduled_date: string | null;
  executed_date: string | null;
  cost: string | null;
  invoice_number: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  asset?: Pick<Asset, 'id' | 'name' | 'internal_code'>;
  service_provider?: ServiceProvider;
  creator?: { id: number; name: string };
}

export interface UserSoftwareAssignment {
  id: number;
  user_id: number;
  software_name: string;
  version: string | null;
  license_key: string | null;
  assigned_at: string;
  expires_at: string | null;
  assigned_by: number;
  notes: string | null;
  is_active: boolean;
}

export interface UserTechProfile {
  user: { id: number; name: string; email: string; role?: { name: string }; area?: { name: string } };
  current_assets: Asset[];
  historical_assets: AssetAssignment[];
  tickets_summary: { total: number; open_count: number; closed_count: number };
  software: UserSoftwareAssignment[];
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const assetsApi = {
  // Asset Types
  getTypes: () => api.get<AssetType[]>('/assets/types'),
  createType: (data: Partial<AssetType>) => api.post<AssetType>('/assets/types', data),
  updateType: (id: number, data: Partial<AssetType>) => api.patch<AssetType>(`/assets/types/${id}`, data),
  deleteType: (id: number) => api.delete(`/assets/types/${id}`),
  getTypeFields: (typeId: number) => api.get<AssetTypeField[]>(`/assets/types/${typeId}/fields`),
  createTypeField: (typeId: number, data: Partial<AssetTypeField>) => api.post<AssetTypeField>(`/assets/types/${typeId}/fields`, data),
  updateTypeField: (typeId: number, fieldId: number, data: Partial<AssetTypeField>) => api.patch<AssetTypeField>(`/assets/types/${typeId}/fields/${fieldId}`, data),
  deleteTypeField: (typeId: number, fieldId: number) => api.delete(`/assets/types/${typeId}/fields/${fieldId}`),

  // Locations
  getLocations: () => api.get<Location[]>('/locations'),
  getLocationsByArea: (areaId: number) => api.get<Location[]>(`/areas/${areaId}/locations`),
  createLocation: (areaId: number, data: Partial<Location>) => api.post<Location>(`/areas/${areaId}/locations`, data),
  updateLocation: (id: number, data: Partial<Location>) => api.patch<Location>(`/locations/${id}`, data),
  deleteLocation: (id: number) => api.delete(`/locations/${id}`),

  // Service Providers
  getProviders: () => api.get<ServiceProvider[]>('/service-providers'),
  createProvider: (data: Partial<ServiceProvider>) => api.post<ServiceProvider>('/service-providers', data),
  updateProvider: (id: number, data: Partial<ServiceProvider>) => api.patch<ServiceProvider>(`/service-providers/${id}`, data),
  deleteProvider: (id: number) => api.delete(`/service-providers/${id}`),

  // Assets
  getAssets: (params?: Record<string, string | number>) => api.get<{ data: Asset[]; total: number; last_page: number }>('/assets', { params }),
  getAsset: (id: number) => api.get<Asset>(`/assets/${id}`),
  createAsset: (data: Record<string, unknown>) => api.post<Asset>('/assets', data),
  updateAsset: (id: number, data: Record<string, unknown>) => api.patch<Asset>(`/assets/${id}`, data),
  updateAssetStatus: (id: number, status: AssetStatus, notes?: string) => api.patch<Asset>(`/assets/${id}/status`, { status, notes }),
  updateAssetLocation: (id: number, locationId: number, reason?: string) => api.patch<Asset>(`/assets/${id}/location`, { location_id: locationId, reason }),
  deleteAsset: (id: number) => api.delete(`/assets/${id}`),

  // Asset Events & History
  getAssetEvents: (id: number) => api.get<AssetEvent[]>(`/assets/${id}/events`),
  getAssetAssignments: (id: number) => api.get<AssetAssignment[]>(`/assets/${id}/assignments`),
  getAssetMaintenances: (id: number) => api.get<AssetMaintenance[]>(`/assets/${id}/maintenances`),

  // Assignments
  assignAsset: (assetId: number, userId: number, reason?: string) => api.post<AssetAssignment>(`/assets/${assetId}/assign`, { user_id: userId, reason }),
  returnAsset: (assetId: number, returnNotes?: string) => api.post<AssetAssignment>(`/assets/${assetId}/return`, { return_notes: returnNotes }),
  getUserAssets: (userId: number) => api.get<Asset[]>(`/users/${userId}/assets`),

  // Maintenances
  getMaintenances: (params?: Record<string, string | number>) => api.get<{ data: AssetMaintenance[]; total: number; last_page: number }>('/maintenances', { params }),
  getMaintenance: (id: number) => api.get<AssetMaintenance>(`/maintenances/${id}`),
  createMaintenance: (data: Record<string, unknown>) => api.post<AssetMaintenance>('/maintenances', data),
  updateMaintenance: (id: number, data: Record<string, unknown>) => api.patch<AssetMaintenance>(`/maintenances/${id}`, data),
  updateMaintenanceStatus: (id: number, data: Record<string, unknown>) => api.patch<AssetMaintenance>(`/maintenances/${id}/status`, data),

  // User Tech Profile
  getUserTechProfile: (userId: number) => api.get<UserTechProfile>(`/users/${userId}/profile/tech`),
  getUserSoftware: (userId: number) => api.get<UserSoftwareAssignment[]>(`/users/${userId}/profile/software`),
  assignSoftware: (userId: number, data: Record<string, unknown>) => api.post<UserSoftwareAssignment>(`/users/${userId}/profile/software`, data),
  revokeSoftware: (userId: number, softwareId: number) => api.delete(`/users/${userId}/profile/software/${softwareId}`),
};
