import { useFonts as useExpoFonts } from 'expo-font';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

/**
 * Hook personalizado para cargar todas las fuentes necesarias de la aplicación.
 * Retorna loaded en true cuando las fuentes están listas.
 */
export function useAppFonts() {
  const [loaded, error] = useExpoFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  return { loaded, error };
}
