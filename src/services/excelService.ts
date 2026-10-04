import * as XLSX from 'xlsx';
import { Question } from '../types';

export interface ParseExcelResult {
  questions: Question[];
  totalRows: number;
}

export function downloadExcelTemplate(): void {
  // Headers required by specification
  const headers = [
    'pregunta',
    'opcion_a',
    'opcion_b',
    'opcion_c',
    'opcion_d',
    'respuesta_correcta',
    'curiosidad_explicacion',
  ];

  // 3 high quality example rows
  const exampleRows = [
    [
      '¿Qué animal produce naturalmente heces con forma cúbica para evitar que rueden cuesta abajo?',
      'El Wombat australiano',
      'El Pangolín de Java',
      'El Camaleón pigmeo',
      'El Topo nariz de estrella',
      'A',
      'El wombat es el único animal en el planeta que produce heces cúbicas para marcar territorio sin que rueden de las rocas.',
    ],
    [
      '¿Qué país permaneció técnicamente en guerra con Andorra durante 44 años por olvido en el Tratado de Versalles?',
      'El Imperio Otomano',
      'Alemania',
      'El Imperio Austrohúngaro',
      'Bulgaria',
      'B',
      'Andorra declaró la guerra a Alemania en 1914 con 10 hombres y fue olvidada en el pacto de paz hasta 1958.',
    ],
    [
      '¿Cuántos corazones y de qué color es la sangre que tiene un pulpo común?',
      '2 corazones y sangre verde',
      '3 corazones y sangre azul intenso',
      '1 corazón gigante y sangre violeta',
      '4 corazones y sangre transparente',
      'B',
      'Los pulpos tienen tres corazones y su sangre es azul gracias a la hemocianina rica en cobre.',
    ],
  ];

  const data = [headers, ...exampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 55 }, // pregunta
    { wch: 28 }, // opcion_a
    { wch: 28 }, // opcion_b
    { wch: 28 }, // opcion_c
    { wch: 28 }, // opcion_d
    { wch: 20 }, // respuesta_correcta
    { wch: 55 }, // curiosidad_explicacion
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Preguntas Trivia');

  XLSX.writeFile(workbook, 'plantilla_bullshit_trivia.xlsx');
}

export async function parseExcelFile(file: File): Promise<ParseExcelResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (workbook.SheetNames.length === 0) {
    throw new Error('El archivo Excel no contiene ninguna hoja de cálculo.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  // Convert sheet to json array
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
  });

  if (!rawData || rawData.length === 0) {
    throw new Error('La hoja de cálculo está vacía o no contiene filas de datos.');
  }

  // Validate headers in first row keys
  const firstRowKeys = Object.keys(rawData[0]).map((k) =>
    k.trim().toLowerCase().replace(/\s+/g, '_')
  );

  const requiredCols = [
    'pregunta',
    'opcion_a',
    'opcion_b',
    'opcion_c',
    'opcion_d',
    'respuesta_correcta',
  ];

  const missingCols = requiredCols.filter((col) => !firstRowKeys.includes(col));
  if (missingCols.length > 0) {
    throw new Error(
      `El archivo no contiene las columnas requeridas: ${missingCols.join(', ')}. Descarga la plantilla oficial para ver el formato correcto.`
    );
  }

  const questions: Question[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const rawRow = rawData[i];
    // Normalize keys
    const row: Record<string, string> = {};
    for (const key of Object.keys(rawRow)) {
      const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      row[normalizedKey] = String(rawRow[key] || '').trim();
    }

    const qText = row['pregunta'];
    const optA = row['opcion_a'];
    const optB = row['opcion_b'];
    const optC = row['opcion_c'];
    const optD = row['opcion_d'];
    let correctRaw = row['respuesta_correcta'].toUpperCase().trim();
    const explanation = row['curiosidad_explicacion'] || 'Dato verificado del concurso.';

    // Skip completely empty trailing lines
    if (!qText && !optA && !optB && !optC && !optD) {
      continue;
    }

    // Row number for clear error messages (account for 1-index header + data index)
    const rowNumber = i + 2;

    if (!qText) {
      throw new Error(`Fila ${rowNumber}: Falta el texto de la columna 'pregunta'.`);
    }
    if (!optA || !optB || !optC || !optD) {
      throw new Error(
        `Fila ${rowNumber}: Se deben proporcionar las 4 opciones completas (opcion_a, opcion_b, opcion_c, opcion_d).`
      );
    }

    // Clean possible values like 'A)' or 'Opción A'
    if (correctRaw.length > 1) {
      const match = correctRaw.match(/([ABCD])/);
      if (match) {
        correctRaw = match[1];
      }
    }

    if (!['A', 'B', 'C', 'D'].includes(correctRaw)) {
      throw new Error(
        `Fila ${rowNumber}: La 'respuesta_correcta' debe ser A, B, C o D (se encontró "${row['respuesta_correcta']}").`
      );
    }

    questions.push({
      id: questions.length + 1,
      category: 'Preguntas Personalizadas',
      question: qText,
      options: {
        A: optA,
        B: optB,
        C: optC,
        D: optD,
      },
      correctOption: correctRaw as 'A' | 'B' | 'C' | 'D',
      explanation: explanation,
    });
  }

  if (questions.length === 0) {
    throw new Error('No se encontraron preguntas válidas en el archivo Excel.');
  }

  return {
    questions,
    totalRows: questions.length,
  };
}
