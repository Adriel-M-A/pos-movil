/**
 * Tipos de datos compartidos de la aplicación
 */

export type MetodoPago = 'efectivo' | 'transferencia' | 'qr' | 'credito';

export interface VentaPagoInput {
  metodo: MetodoPago;
  monto: number;
}

export interface Caja {
  id: number;
  fechaApertura: string; // ISO 8601 local
  fondoInicial: number;
  fechaCierre: string | null; // null si sigue abierta
  montoContado: number | null; // null si sigue abierta
  estado: 'abierta' | 'cerrada';
}

export interface Venta {
  id: number;
  cajaId: number;
  monto: number;
  timestamp: string; // ISO 8601 local
  nota: string | null;
}

export interface VentaPago {
  id: number;
  ventaId: number;
  metodo: MetodoPago;
  monto: number;
}

export interface VentaConPagos extends Venta {
  pagos: VentaPago[];
}

export interface ConfigEntry {
  clave: string;
  valor: string;
}
