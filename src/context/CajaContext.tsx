import React, { createContext, useContext, useState, useEffect } from 'react';
import { Caja, VentaConPagos } from '@/types';
import {
  obtenerCajaAbierta,
  abrirCaja as abrirCajaDb,
  cerrarCaja as cerrarCajaDb,
  obtenerVentasDeCaja,
  cargarVenta,
  eliminarVenta,
} from '@/db/repositorio';

interface CajaContextType {
  /** La caja actualmente abierta en la app, o null si está cerrada */
  cajaActiva: Caja | null;
  /** Ventas asociadas a la caja activa */
  ventas: VentaConPagos[];
  /** Indica si se está consultando la DB */
  cargando: boolean;
  /** Fuerza la recarga del estado activo desde SQLite */
  cargarEstadoActivo: () => Promise<void>;
  /** Abre una nueva caja e inicia la jornada */
  iniciarNuevaCaja: (fondo: number) => Promise<Caja>;
  /** Cierra la caja activa registrando el dinero contado */
  cerrarCajaActiva: (montoContado: number) => Promise<Caja>;
  /** Refresca la lista de ventas de la caja activa */
  refrescarDatos: () => Promise<void>;
  /** Guarda una nueva venta en la caja activa */
  guardarNuevaVenta: (monto: number, pagos: Array<{ metodo: 'efectivo' | 'transferencia' | 'qr' | 'credito'; monto: number }>) => Promise<void>;
  /** Elimina una venta de la base de datos y actualiza el estado */
  eliminarVentaActiva: (ventaId: number) => Promise<void>;
}

const CajaContext = createContext<CajaContextType | undefined>(undefined);

export function CajaProvider({ children }: { children: React.ReactNode }) {
  const [cajaActiva, setCajaActiva] = useState<Caja | null>(null);
  const [ventas, setVentas] = useState<VentaConPagos[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Consulta a la DB el estado actual de la caja
  const cargarEstadoActivo = async () => {
    try {
      setCargando(true);
      const activa = await obtenerCajaAbierta();
      if (activa) {
        const cajaFormateada: Caja = {
          id: activa.id,
          fechaApertura: activa.fechaApertura,
          fondoInicial: activa.fondoInicial,
          fechaCierre: activa.fechaCierre,
          montoContado: activa.montoContado,
          estado: activa.estado as 'abierta' | 'cerrada',
        };
        setCajaActiva(cajaFormateada);
        
        // Obtener ventas asociadas a esta caja activa
        const ventasDb = await obtenerVentasDeCaja(activa.id);
        setVentas(ventasDb as VentaConPagos[]);
      } else {
        setCajaActiva(null);
        setVentas([]);
      }
    } catch (error) {
      console.error('Error al cargar estado activo de la caja:', error);
    } finally {
      setCargando(false);
    }
  };

  // Crea una nueva sesión de caja
  const iniciarNuevaCaja = async (fondo: number) => {
    try {
      setCargando(true);
      const nueva = await abrirCajaDb(fondo);
      const cajaFormateada: Caja = {
        id: nueva.id,
        fechaApertura: nueva.fechaApertura,
        fondoInicial: nueva.fondoInicial,
        fechaCierre: nueva.fechaCierre,
        montoContado: nueva.montoContado,
        estado: nueva.estado as 'abierta' | 'cerrada',
      };
      setCajaActiva(cajaFormateada);
      setVentas([]);
      return cajaFormateada;
    } catch (error) {
      console.error('Error al iniciar nueva caja:', error);
      throw error;
    } finally {
      setCargando(false);
    }
  };

  // Cierra el arqueo de caja de la jornada actual
  const cerrarCajaActiva = async (montoContado: number) => {
    if (!cajaActiva) {
      throw new Error('No hay ninguna caja activa para cerrar.');
    }
    try {
      setCargando(true);
      const cerrada = await cerrarCajaDb(cajaActiva.id, montoContado);
      const cajaFormateada: Caja = {
        id: cerrada.id,
        fechaApertura: cerrada.fechaApertura,
        fondoInicial: cerrada.fondoInicial,
        fechaCierre: cerrada.fechaCierre,
        montoContado: cerrada.montoContado,
        estado: cerrada.estado as 'abierta' | 'cerrada',
      };
      setCajaActiva(null);
      setVentas([]);
      return cajaFormateada;
    } catch (error) {
      console.error('Error al cerrar caja activa:', error);
      throw error;
    } finally {
      setCargando(false);
    }
  };

  // Recarga ventas en memoria de la caja activa
  const refrescarDatos = async () => {
    if (!cajaActiva) return;
    try {
      const ventasDb = await obtenerVentasDeCaja(cajaActiva.id);
      setVentas(ventasDb as VentaConPagos[]);
    } catch (error) {
      console.error('Error al refrescar ventas de caja activa:', error);
    }
  };

  // Cargar estado inicial al montar el proveedor
  useEffect(() => {
    cargarEstadoActivo();
  }, []);

  // Guarda una nueva venta
  const guardarNuevaVenta = async (monto: number, pagos: Array<{ metodo: 'efectivo' | 'transferencia' | 'qr' | 'credito'; monto: number }>) => {
    if (!cajaActiva) throw new Error('No hay caja activa para registrar la venta.');
    try {
      await cargarVenta(cajaActiva.id, monto, pagos);
      await refrescarDatos();
    } catch (error) {
      console.error('Error al guardar venta:', error);
      throw error;
    }
  };

  // Elimina una venta
  const eliminarVentaActiva = async (ventaId: number) => {
    try {
      await eliminarVenta(ventaId);
      await refrescarDatos();
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      throw error;
    }
  };

  return (
    <CajaContext.Provider
      value={{
        cajaActiva,
        ventas,
        cargando,
        cargarEstadoActivo,
        iniciarNuevaCaja,
        cerrarCajaActiva,
        refrescarDatos,
        guardarNuevaVenta,
        eliminarVentaActiva,
      }}
    >
      {children}
    </CajaContext.Provider>
  );
}

export function useCaja() {
  const context = useContext(CajaContext);
  if (!context) {
    throw new Error('useCaja debe ser usado dentro de un CajaProvider');
  }
  return context;
}
