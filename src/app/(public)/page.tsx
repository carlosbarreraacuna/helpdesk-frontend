export default function HomePage() {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">HelpDesk Portal</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Sistema de gestión de tickets de soporte técnico
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎫</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Crear Ticket</h2>
          <p className="text-gray-600 mb-4">
            Reporta un problema o solicita soporte técnico
          </p>
          <a 
            href="/portal/create-ticket"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Crear Nuevo Ticket
          </a>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Consultar Ticket</h2>
          <p className="text-gray-600 mb-4">
            Revisa el estado de tu ticket existente
          </p>
          <a 
            href="/portal/search-ticket"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Buscar Ticket
          </a>
        </div>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold mb-2">Acceso Interno</h3>
        <p className="text-gray-600 mb-4">
          Personal autorizado puede acceder al sistema interno de gestión
        </p>
        <a 
          href="/login"
          className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
        >
          Iniciar Sesión
        </a>
      </div>
    </div>
  );
}
