import { integer, real, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Registra cada sesión de trabajo (apertura y cierre de caja).
 * Solo puede existir una caja con estado 'abierta' a la vez.
 */
export const cajas = sqliteTable('cajas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fechaApertura: text('fecha_apertura').notNull(), // ISO 8601 en hora local: 2026-06-13T08:00:00
  fondoInicial: real('fondo_inicial').notNull(),
  fechaCierre: text('fecha_cierre'), // null si la caja está abierta
  montoContado: real('monto_contado'), // lo que el usuario cuenta físicamente al cerrar
  estado: text('estado', { enum: ['abierta', 'cerrada'] }).notNull().default('abierta'),
});

/**
 * Una fila por cada venta registrada.
 * El borrado es físico (DELETE), con cascada hacia venta_pagos.
 */
export const ventas = sqliteTable('ventas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cajaId: integer('caja_id').notNull().references(() => cajas.id, { onDelete: 'cascade' }),
  monto: real('monto').notNull(),
  timestamp: text('timestamp').notNull(), // ISO 8601 en hora local, generado por la app
  nota: text('nota'), // campo libre opcional
}, (table) => ({
  cajaIdIdx: index('ventas_caja_id_idx').on(table.cajaId),
  timestampIdx: index('ventas_timestamp_idx').on(table.timestamp),
}));

/**
 * Métodos de pago de cada venta.
 * La suma de montos en esta tabla debe ser igual a ventas.monto (validado en la app).
 */
export const ventaPagos = sqliteTable('venta_pagos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ventaId: integer('venta_id').notNull().references(() => ventas.id, { onDelete: 'cascade' }),
  metodo: text('metodo', { enum: ['efectivo', 'transferencia', 'qr', 'credito'] }).notNull(),
  monto: real('monto').notNull(),
}, (table) => ({
  ventaIdIdx: index('venta_pagos_venta_id_idx').on(table.ventaId),
}));

/**
 * Settings generales de la app en formato clave-valor.
 * Ejemplo: clave='fondo_inicial_default', valor='10000'
 */
export const configuraciones = sqliteTable('configuraciones', {
  clave: text('clave').primaryKey(),
  valor: text('valor').notNull(),
});
