import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { theme } from '@/theme';
import { Boton } from './Boton';
import { Tarjeta } from './Tarjeta';

interface ModalConfirmacionProps {
  /** Indica si el modal está visible */
  visible: boolean;
  /** Título del modal */
  titulo: string;
  /** Mensaje o descripción explicativa */
  mensaje: string;
  /** Texto del botón de confirmación */
  textoConfirmar?: string;
  /** Texto del botón de cancelación */
  textoCancelar?: string;
  /** Indica si la acción es destructiva (ej. borrar venta) */
  esPeligroso?: boolean;
  /** Función ejecutada al confirmar la acción */
  onConfirmar: () => void;
  /** Función ejecutada al cancelar o cerrar el modal */
  onCancelar: () => void;
}

export function ModalConfirmacion({
  visible,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  esPeligroso = false,
  onConfirmar,
  onCancelar,
}: ModalConfirmacionProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancelar}
    >
      <TouchableWithoutFeedback onPress={onCancelar}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.contenedorTarjeta}>
              <Tarjeta tinted={false} border={true} style={styles.tarjeta}>
                <Text style={styles.titulo}>{titulo}</Text>
                
                <Text style={styles.mensaje}>{mensaje}</Text>
                
                <View style={styles.contenedorBotones}>
                  <Boton
                    titulo={textoCancelar}
                    onPress={onCancelar}
                    variant="outline"
                    alto="min"
                    style={styles.boton}
                  />
                  <Boton
                    titulo={textoConfirmar}
                    onPress={onConfirmar}
                    variant={esPeligroso ? 'danger' : 'primary'}
                    alto="min"
                    style={[styles.boton, styles.botonDerecho]}
                  />
                </View>
              </Tarjeta>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  contenedorTarjeta: {
    width: '100%',
    maxWidth: 340, // Límite de ancho para que no se estire demasiado en tablets
  },
  tarjeta: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  titulo: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.lg,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  mensaje: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  contenedorBotones: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  boton: {
    flex: 1,
  },
  botonDerecho: {
    marginLeft: theme.spacing.md,
  },
});
