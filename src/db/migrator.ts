import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './client';
import migrations from './migrations/migrations';

/**
 * Hook que ejecuta las migraciones al iniciar la app.
 * Retorna { success, error } para manejar el estado de carga.
 */
export function useDBMigrations() {
  return useMigrations(db, migrations);
}
