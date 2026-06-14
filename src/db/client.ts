import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expo = openDatabaseSync('pos_kiosco.db', { enableChangeListener: true });

/**
 * Instancia del cliente Drizzle lista para usar en toda la app.
 * La base de datos se abre de forma síncrona al importar este módulo.
 */
export const db = drizzle(expo, { schema });
