import { eq, and, desc, like } from 'drizzle-orm';
import { db } from './client';
import { cajas, ventas, ventaPagos, configuraciones } from './schema';

// Utilidad para obtener la fecha y hora local en formato ISO 8601
function ahoraLocal(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
}

// --- Cajas ---

/**
 * Devuelve la caja con estado 'abierta', o null si no existe ninguna.
 */
export async function obtenerCajaAbierta() {
  const result = await db
    .select()
    .from(cajas)
    .where(eq(cajas.estado, 'abierta'))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Abre una nueva caja de trabajo.
 * @param fondoInicial - Efectivo con el que se inicia la jornada
 */
export async function abrirCaja(fondoInicial: number) {
  const [nueva] = await db
    .insert(cajas)
    .values({
      fondoInicial,
      fechaApertura: ahoraLocal(),
      estado: 'abierta',
    })
    .returning();
  return nueva;
}

/**
 * Cierra la caja activa registrando el monto físico contado.
 * @param cajaId - ID de la caja a cerrar
 * @param montoContado - Efectivo que el operador contó físicamente
 */
export async function cerrarCaja(cajaId: number, montoContado: number) {
  const [cerrada] = await db
    .update(cajas)
    .set({
      estado: 'cerrada',
      fechaCierre: ahoraLocal(),
      montoContado,
    })
    .where(eq(cajas.id, cajaId))
    .returning();
  return cerrada;
}

/**
 * Devuelve todas las cajas cerradas en orden descendente (más reciente primero).
 */
export async function obtenerHistorialCajas() {
  return db
    .select()
    .from(cajas)
    .where(eq(cajas.estado, 'cerrada'))
    .orderBy(cajas.fechaApertura);
}

// --- Ventas ---

/**
 * Carga una venta y sus métodos de pago en una sola transacción atómica.
 * Valida que la suma de los pagos sea igual al monto total.
 *
 * @param cajaId - ID de la caja activa
 * @param monto - Monto total de la venta
 * @param pagos - Lista de métodos y montos
 * @param nota - Comentario opcional
 */
export async function cargarVenta(
  cajaId: number,
  monto: number,
  pagos: Array<{ metodo: 'efectivo' | 'transferencia' | 'qr' | 'credito'; monto: number }>,
  nota?: string,
) {
  // Validación de coherencia de pagos
  const totalPagos = pagos.reduce((sum, p) => sum + p.monto, 0);
  if (Math.abs(totalPagos - monto) > 0.01) {
    throw new Error(
      `La suma de los pagos ($${totalPagos}) no coincide con el monto de la venta ($${monto}).`,
    );
  }

  return db.transaction(async (tx) => {
    const [venta] = await tx
      .insert(ventas)
      .values({ cajaId, monto, timestamp: ahoraLocal(), nota })
      .returning();

    await tx.insert(ventaPagos).values(
      pagos.map((p) => ({ ventaId: venta.id, metodo: p.metodo, monto: p.monto })),
    );

    return venta;
  });
}

/**
 * Elimina físicamente una venta y sus pagos asociados de la base de datos.
 * @param ventaId - ID de la venta a eliminar
 */
export async function eliminarVenta(ventaId: number) {
  await db.transaction(async (tx) => {
    await tx.delete(ventaPagos).where(eq(ventaPagos.ventaId, ventaId));
    await tx.delete(ventas).where(eq(ventas.id, ventaId));
  });
}

/**
 * Devuelve todas las ventas de una caja con sus métodos de pago.
 * @param cajaId - ID de la caja de la que se quieren las ventas
 */
export async function obtenerVentasDeCaja(cajaId: number) {
  const ventasList = await db
    .select()
    .from(ventas)
    .where(eq(ventas.cajaId, cajaId))
    .orderBy(ventas.timestamp);

  const pagosPromises = ventasList.map((v) =>
    db.select().from(ventaPagos).where(eq(ventaPagos.ventaId, v.id)),
  );
  const pagosList = await Promise.all(pagosPromises);

  return ventasList.map((v, i) => ({ ...v, pagos: pagosList[i] }));
}

// --- Configuraciones ---

/**
 * Devuelve el valor de una configuración por su clave, o null si no existe.
 * @param clave - Identificador de la configuración (ej. 'fondo_inicial_default')
 */
export async function obtenerConfiguracion(clave: string): Promise<string | null> {
  const result = await db
    .select()
    .from(configuraciones)
    .where(eq(configuraciones.clave, clave))
    .limit(1);
  return result[0]?.valor ?? null;
}

/**
 * Guarda o actualiza una configuración por su clave.
 * @param clave - Identificador de la configuración
 * @param valor - Valor a guardar (siempre como string)
 */
export async function guardarConfiguracion(clave: string, valor: string) {
  await db
    .insert(configuraciones)
    .values({ clave, valor })
    .onConflictDoUpdate({ target: configuraciones.clave, set: { valor } });
}

// --- Métricas y Reportes ---

/**
 * Obtiene el resumen de ventas de las últimas 7 cajas cerradas.
 * @returns Array con id de caja, fecha amigable y total vendido
 */
export async function obtenerResumenHistorico(limite: number = 7) {
  const historialCajas = await db
    .select()
    .from(cajas)
    .where(eq(cajas.estado, 'cerrada'))
    .orderBy(desc(cajas.fechaApertura))
    .limit(limite);

  const resumen = [];
  for (const caja of historialCajas) {
    const ventasCaja = await db
      .select()
      .from(ventas)
      .where(eq(ventas.cajaId, caja.id));
    const totalVendido = ventasCaja.reduce((sum, v) => sum + v.monto, 0);
    resumen.push({
      cajaId: caja.id,
      fechaApertura: caja.fechaApertura,
      totalVendido,
    });
  }
  
  return resumen.reverse();
}

/**
 * Obtiene la sumatoria de pagos agrupados por su método, opcionalmente limitado a las últimas N cajas cerradas.
 */
export async function obtenerResumenPorMetodo(limiteCajas?: number) {
  const todosLosPagos = await db.select().from(ventaPagos);
  const resumen = {
    efectivo: 0,
    transferencia: 0,
    qr: 0,
    credito: 0,
  };

  if (limiteCajas !== undefined) {
    const ultimasCajas = await db
      .select({ id: cajas.id })
      .from(cajas)
      .where(eq(cajas.estado, 'cerrada'))
      .orderBy(desc(cajas.fechaApertura))
      .limit(limiteCajas);
    const idsCajas = new Set(ultimasCajas.map((c) => c.id));

    const todasLasVentas = await db.select().from(ventas);
    const idsVentasValidas = new Set(
      todasLasVentas.filter((v) => idsCajas.has(v.cajaId)).map((v) => v.id)
    );

    const pagosFiltrados = todosLosPagos.filter((p) => idsVentasValidas.has(p.ventaId));
    pagosFiltrados.forEach((pago) => {
      if (pago.metodo in resumen) {
        resumen[pago.metodo as keyof typeof resumen] += pago.monto;
      }
    });
    return resumen;
  }

  todosLosPagos.forEach((pago) => {
    if (pago.metodo in resumen) {
      resumen[pago.metodo as keyof typeof resumen] += pago.monto;
    }
  });
  return resumen;
}

/**
 * Genera un texto plano en formato CSV con el histórico de ventas.
 * Utiliza punto y coma (;) como separador para compatibilidad en Excel de habla hispana.
 */
export async function exportarA_CSV(): Promise<string> {
  const todasLasCajas = await db.select().from(cajas);
  const todasLasVentas = await db.select().from(ventas).orderBy(desc(ventas.timestamp));
  const todosLosPagos = await db.select().from(ventaPagos);

  const mapaCajas = new Map(todasLasCajas.map((c) => [c.id, c]));
  
  const mapaPagos = new Map<number, typeof todosLosPagos>();
  todosLosPagos.forEach((p) => {
    const list = mapaPagos.get(p.ventaId) || [];
    list.push(p);
    mapaPagos.set(p.ventaId, list);
  });

  let csv = 'ID Venta;Fecha y Hora;ID Caja;Fondo Apertura Caja;Monto Total Venta;Detalle Pagos;Nota Venta\n';

  todasLasVentas.forEach((venta) => {
    const caja = mapaCajas.get(venta.cajaId);
    const pagosVenta = mapaPagos.get(venta.id) || [];
    const detallePagos = pagosVenta
      .map((p) => `${p.metodo}: $${p.monto}`)
      .join(' | ');

    const notaEscapada = venta.nota
      ? venta.nota.replace(/;/g, ',').replace(/\n/g, ' ')
      : '';
    const fechaFormateada = venta.timestamp;
    const fondoCaja = caja ? caja.fondoInicial : 0;

    csv += `${venta.id};${fechaFormateada};${venta.cajaId};${fondoCaja};${venta.monto};${detallePagos};${notaEscapada}\n`;
  });

  return csv;
}

/**
 * Obtiene todas las ventas y la distribución de métodos de pago para un mes específico (YYYY-MM).
 */
export async function obtenerDatosMensuales(anioMes: string) {
  const ventasMes = await db
    .select()
    .from(ventas)
    .where(like(ventas.timestamp, `${anioMes}-%`))
    .orderBy(ventas.timestamp);

  const pagosMes = await db
    .select({
      metodo: ventaPagos.metodo,
      monto: ventaPagos.monto,
    })
    .from(ventaPagos)
    .innerJoin(ventas, eq(ventaPagos.ventaId, ventas.id))
    .where(like(ventas.timestamp, `${anioMes}-%`));

  const pagosPorMetodo = {
    efectivo: 0,
    transferencia: 0,
    qr: 0,
    credito: 0,
  };

  pagosMes.forEach((p) => {
    if (p.metodo in pagosPorMetodo) {
      pagosPorMetodo[p.metodo as keyof typeof pagosPorMetodo] += p.monto;
    }
  });

  const totalVendido = ventasMes.reduce((sum, v) => sum + v.monto, 0);

  return {
    ventas: ventasMes,
    pagosPorMetodo,
    totalVendido,
  };
}

/**
 * Obtiene la sumatoria mensual de ventas para los últimos N meses finalizando en el mes dado.
 */
export async function obtenerTendenciaMensual(anioMesFin: string, mesesAtras: number = 6) {
  const result = [];
  const [anioStr, mesStr] = anioMesFin.split('-');
  let anio = parseInt(anioStr);
  let mes = parseInt(mesStr);

  const mesesList: string[] = [];
  for (let i = 0; i < mesesAtras; i++) {
    const mStr = String(mes).padStart(2, '0');
    mesesList.unshift(`${anio}-${mStr}`);
    mes = mes - 1;
    if (mes === 0) {
      mes = 12;
      anio = anio - 1;
    }
  }

  for (const m of mesesList) {
    const ventasMes = await db
      .select({ monto: ventas.monto })
      .from(ventas)
      .where(like(ventas.timestamp, `${m}-%`));
    const total = ventasMes.reduce((sum, v) => sum + v.monto, 0);
    result.push({
      mes: m,
      total,
    });
  }

  return result;
}

