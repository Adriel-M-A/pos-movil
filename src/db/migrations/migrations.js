// Migraciones de Drizzle embebidas como strings para compatibilidad con Metro Bundler.
// No usar babel-plugin-inline-import ya que es incompatible con Babel 7+ / Metro moderno.

import journal from './meta/_journal.json';

const m0000 = `CREATE TABLE \`cajas\` (
\t\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
\t\`fecha_apertura\` text NOT NULL,
\t\`fondo_inicial\` real NOT NULL,
\t\`fecha_cierre\` text,
\t\`monto_contado\` real,
\t\`estado\` text DEFAULT 'abierta' NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`configuraciones\` (
\t\`clave\` text PRIMARY KEY NOT NULL,
\t\`valor\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`venta_pagos\` (
\t\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
\t\`venta_id\` integer NOT NULL,
\t\`metodo\` text NOT NULL,
\t\`monto\` real NOT NULL,
\tFOREIGN KEY (\`venta_id\`) REFERENCES \`ventas\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`ventas\` (
\t\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
\t\`caja_id\` integer NOT NULL,
\t\`monto\` real NOT NULL,
\t\`timestamp\` text NOT NULL,
\t\`nota\` text,
\tFOREIGN KEY (\`caja_id\`) REFERENCES \`cajas\`(\`id\`) ON UPDATE no action ON DELETE no action
);`;

export default {
  journal,
  migrations: {
    m0000,
  },
};