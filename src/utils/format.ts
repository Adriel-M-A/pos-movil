/**
 * Formatea una fecha en formato ISO 8601 a una cadena amigable en español.
 * Ejemplo: "2026-06-13T08:00:00" -> "13 de junio, 08:00 hs"
 *
 * @param isoString - Fecha en formato ISO 8601
 * @returns Cadena de fecha formateada de manera amigable
 */
export function formatearFechaApertura(isoString: string): string {
  if (!isoString) return '';
  try {
    const normalizado = isoString.replace(' ', 'T');
    const [fechaPart, horaPart] = normalizado.split('T');
    
    const separador = fechaPart.includes('-') ? '-' : '/';
    const partesFecha = fechaPart.split(separador);
    
    let yyyy = partesFecha[0];
    let mm = partesFecha[1];
    let dd = partesFecha[2];
    
    if (yyyy.length === 2 && dd.length === 4) {
      const temp = yyyy;
      yyyy = dd;
      dd = temp;
    }
    
    const partesHora = horaPart.split(':');
    const hh = partesHora[0];
    const min = partesHora[1];
    
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const mesInt = parseInt(mm, 10) - 1;
    const nombreMes = meses[mesInt] || mm;
    
    return `${parseInt(dd, 10)} de ${nombreMes}, ${hh}:${min} hs`;
  } catch (err) {
    console.error('Error al formatear fecha de apertura:', err);
    return isoString;
  }
}
