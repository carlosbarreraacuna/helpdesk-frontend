export interface Report {
  id: number;
  key: string;
  name: string;
  description: string;
  type: 'metric' | 'chart' | 'table' | 'export';
  chart_type?: string;
  icon: string;
  config: {
    color?: string;
    endpoint: string;
    format?: string;
    columns?: string[];
    formats?: string[];
    days?: number;
  };
  is_system: boolean;
  is_active: boolean;
  order: number;
  can_view?: boolean;
  can_export?: boolean;
}

export interface MetricData {
  value: number;
  label?: string;
  change?: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    label?: string;
  }>;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  level: number;
}
