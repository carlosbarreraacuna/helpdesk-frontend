'use client';

export default function FontTest() {
  return (
    <div className="p-8 space-y-4 bg-white rounded-lg shadow-sm border">
      <h1 className="text-3xl font-bold">Poppins Bold - Título Principal</h1>
      <h2 className="text-2xl font-semibold">Poppins Semibold - Subtítulo</h2>
      <h3 className="text-xl font-medium">Poppins Medium - Título Secundario</h3>
      <p className="text-base font-normal">Poppins Regular - Texto normal del párrafo. Esta es la fuente Poppins aplicada en todo el sistema.</p>
      <p className="text-sm font-light">Poppins Light - Texto ligero para notas secundarias.</p>
      <div className="flex gap-2 mt-4">
        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">Poppins en Botones</span>
        <span className="px-3 py-1 bg-gray-200 text-gray-800 text-xs font-normal rounded-full">Poppins en Tags</span>
      </div>
    </div>
  );
}
