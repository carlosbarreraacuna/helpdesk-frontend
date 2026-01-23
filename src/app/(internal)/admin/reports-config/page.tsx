'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Eye, Download, Plus } from 'lucide-react';
import { Report, Role } from '@/types/reports';

export default function ReportsConfigPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const { data } = await api.get('/roles');
    setRoles(data);
  };

  const loadReportsForRole = async (roleId: number) => {
    setLoading(true);
    const { data } = await api.get(`/report-templates/role/${roleId}`);
    setReports(data.reports);
    setLoading(false);
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    loadReportsForRole(role.id);
  };

  const togglePermission = (reportId: number, field: 'can_view' | 'can_export', currentValue: boolean) => {
    const updatedReports = reports.map(report =>
      report.id === reportId
        ? { ...report, [field]: !currentValue }
        : report
    );
    setReports(updatedReports);
  };

  const saveConfiguration = async () => {
    const reportsToSave = reports.map(report => ({
      report_template_id: report.id,
      can_view: report.can_view || false,
      can_export: report.can_export || false,
    }));

    await api.post(`/report-templates/role/${selectedRole?.id}`, {
      reports: reportsToSave
    });

    alert('Configuración guardada exitosamente');
  };

  const groupedReports = {
    metric: reports.filter(r => r.type === 'metric'),
    chart: reports.filter(r => r.type === 'chart'),
    table: reports.filter(r => r.type === 'table'),
    export: reports.filter(r => r.type === 'export'),
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Configuración de Reportes por Rol</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Columna izquierda: Roles */}
        <div className="col-span-3 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Seleccionar Rol</h2>
          <div className="space-y-2">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className={`w-full text-left p-3 rounded transition ${
                  selectedRole?.id === role.id
                    ? 'bg-blue-100 border-l-4 border-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <p className="font-semibold">{role.display_name}</p>
                <p className="text-xs text-gray-500">Nivel {role.level}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Columna derecha: Reportes */}
        <div className="col-span-9 bg-white rounded-lg shadow p-6">
          {selectedRole ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Reportes para: {selectedRole.display_name}</h2>
                  <p className="text-gray-600">Configura qué reportes puede ver y exportar</p>
                </div>
                <button
                  onClick={saveConfiguration}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  💾 Guardar Cambios
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">Cargando...</div>
              ) : (
                <div className="space-y-6">
                  {/* Métricas */}
                  {groupedReports.metric.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">📊 Métricas</h3>
                      <div className="space-y-2">
                        {groupedReports.metric.map(report => (
                          <ReportPermissionRow
                            key={report.id}
                            report={report}
                            onToggle={togglePermission}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gráficos */}
                  {groupedReports.chart.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">📈 Gráficos</h3>
                      <div className="space-y-2">
                        {groupedReports.chart.map(report => (
                          <ReportPermissionRow
                            key={report.id}
                            report={report}
                            onToggle={togglePermission}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tablas */}
                  {groupedReports.table.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">📋 Tablas</h3>
                      <div className="space-y-2">
                        {groupedReports.table.map(report => (
                          <ReportPermissionRow
                            key={report.id}
                            report={report}
                            onToggle={togglePermission}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exportaciones */}
                  {groupedReports.export.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">💾 Exportaciones</h3>
                      <div className="space-y-2">
                        {groupedReports.export.map(report => (
                          <ReportPermissionRow
                            key={report.id}
                            report={report}
                            onToggle={togglePermission}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resumen */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📊 Resumen</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <strong>Reportes visibles:</strong> {reports.filter(r => r.can_view).length} de {reports.length}
                  </div>
                  <div>
                    <strong>Puede exportar:</strong> {reports.filter(r => r.can_export).length} reportes
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Selecciona un rol para configurar sus reportes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportPermissionRow({ report, onToggle }: { report: Report; onToggle: (reportId: number, field: 'can_view' | 'can_export', currentValue: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
      <div className="flex-1">
        <p className="font-medium">{report.name}</p>
        <p className="text-sm text-gray-600">{report.description}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={report.can_view}
            onChange={() => onToggle(report.id, 'can_view', report.can_view || false)}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm flex items-center gap-1">
            <Eye size={16} className="text-gray-600" />
            Ver
          </span>
        </label>

        {report.type === 'export' || report.type === 'table' ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={report.can_export}
              onChange={() => onToggle(report.id, 'can_export', report.can_export || false)}
              disabled={!report.can_view}
              className="w-4 h-4 text-green-600 disabled:opacity-50"
            />
            <span className="text-sm flex items-center gap-1">
              <Download size={16} className="text-gray-600" />
              Exportar
            </span>
          </label>
        ) : (
          <span className="w-24"></span>
        )}
      </div>
    </div>
  );
}
