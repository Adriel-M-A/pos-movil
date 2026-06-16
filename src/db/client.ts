import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expo = openDatabaseSync('pos_kiosco.db', { enableChangeListener: true });

// Optimizar SQLite local y asegurar integridad de claves foráneas
expo.execSync('PRAGMA foreign_keys = ON;');
expo.execSync('PRAGMA journal_mode = WAL;');
expo.execSync('PRAGMA synchronous = NORMAL;');

/**
 * Instancia del cliente Drizzle lista para usar en toda la app.
 * La base de datos se abre de forma síncrona al importar este módulo.
 */
export const db = drizzle(expo, { schema });
