import { StyleSheet, Text, View, FlatList, Switch, TouchableOpacity, Modal, Button } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';

type Pedido = {
  id: string;
  nombre: string;
  fecha: string;
  realizado: boolean;
};

type Producto = {
  id: string;
  nombre: string;
  cantidad: number;
};

const PedidosMainScreen = ({ navigation }: any) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [modalAgregarProductoVisible, setModalAgregarProductoVisible] = useState(false);
  const [mostrarPedidos, setMostrarPedidos] = useState(true);

  useEffect(() => {
    const db = getDatabase();

    const pedidosRef = ref(db, 'pedidos');
    onValue(pedidosRef, (snapshot) => {
      const data = snapshot.val();
      const pedidosList = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setPedidos(pedidosList);
    });

    const productosRef = ref(db, 'productosDeseados');
    onValue(productosRef, (snapshot) => {
      const data = snapshot.val();
      const productosList = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setProductos(productosList);
    });
  }, []);

  const toggleEstadoPedido = async (id: string, estadoActual: boolean) => {
    const db = getDatabase();
    await update(ref(db, `pedidos/${id}`), {
      realizado: !estadoActual
    });
  };

  const renderPedido = ({ item }: { item: Pedido }) => (
    <TouchableOpacity style={styles.card} onPress={() => setPedidoSeleccionado(item)}>
      <Text style={styles.cardTitle}>{item.nombre}</Text>
      <Text>Fecha: {item.fecha}</Text>
      <View style={styles.row}>
        <Text>{item.realizado ? 'Realizado ✅' : 'Pendiente ⭕️'}</Text>
        <Switch
          value={item.realizado}
          onValueChange={() => toggleEstadoPedido(item.id, item.realizado)}
        />
      </View>
    </TouchableOpacity>
  );

  const renderProducto = ({ item }: { item: Producto }) => (
    <TouchableOpacity onPress={() => setProductoSeleccionado(item)}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🛒 {item.nombre}</Text>
        <Text>Cantidad: {item.cantidad}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Pedidos</Text>

      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[styles.selectorButton, mostrarPedidos && styles.selectorButtonActive]}
          onPress={() => setMostrarPedidos(true)}
        >
          <Text style={[styles.selectorText, mostrarPedidos && styles.selectorTextActive]}>Lista de Pedidos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.selectorButton, !mostrarPedidos && styles.selectorButtonActive]}
          onPress={() => setMostrarPedidos(false)}
        >
          <Text style={[styles.selectorText, !mostrarPedidos && styles.selectorTextActive]}>Lista de Compras</Text>
        </TouchableOpacity>
      </View>

      {mostrarPedidos ? (
        <>
          <View style={styles.titleRow}>
            <Text style={styles.subtitle}>📦 Lista de Pedidos</Text>
            <TouchableOpacity onPress={() => setModalAgregarVisible(true)} style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={pedidos}
            renderItem={renderPedido}
            keyExtractor={(item) => item.id}
            style={styles.fullList}
          />
        </>
      ) : (
        <>
          <View style={styles.titleRow}>
            <Text style={styles.subtitle}>📝 Lista de Compras</Text>
            <TouchableOpacity onPress={() => setModalAgregarProductoVisible(true)} style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={productos}
            renderItem={renderProducto}
            keyExtractor={(item) => item.id}
            style={styles.fullList}
          />
        </>
      )}

      {/* Modal Detalle Pedido */}
      <Modal
        visible={pedidoSeleccionado !== null}
        animationType="slide"
        transparent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {pedidoSeleccionado && (
              <>
                <Text style={styles.cardTitle}>Pedido: {pedidoSeleccionado.nombre}</Text>
                <Text>Fecha: {pedidoSeleccionado.fecha}</Text>
                <Text>Estado: {pedidoSeleccionado.realizado ? 'Realizado ✅' : 'Pendiente ⭕️'}</Text>

                <View style={styles.modalButtons}>
                  <Button title="Editar" onPress={() => {
                    setPedidoSeleccionado(null);
                    navigation.navigate("editarPedidos", { id: pedidoSeleccionado.id });
                  }} />
                  <Button title="Cancelar" onPress={() => setPedidoSeleccionado(null)} color="red" />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Agregar Pedido */}
      <Modal
        visible={modalAgregarVisible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.cardTitle}>Agregar Nuevo Pedido</Text>
            {/* Aquí puedes colocar tus inputs de nombre, fecha, etc */}
            <Button title="Cerrar" onPress={() => setModalAgregarVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={productoSeleccionado !== null}
        animationType="slide"
        transparent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {productoSeleccionado && (
              <>
                <Text style={styles.cardTitle}>Producto: {productoSeleccionado.nombre}</Text>
                <Text>Cantidad: {productoSeleccionado.cantidad}</Text>

                <View style={styles.modalButtons}>
                  <Button
                    title="Editar"
                    onPress={() => {
                      setProductoSeleccionado(null);
                      navigation.navigate('editarProducto', { id: productoSeleccionado.id });
                    }}
                  />
                  <Button
                    title="Cancelar"
                    onPress={() => setProductoSeleccionado(null)}
                    color="red"
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={modalAgregarProductoVisible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.cardTitle}>Agregar nuevo producto</Text>
            {/* Aquí va tu formulario para agregar producto */}
            <Button title="Cerrar" onPress={() => setModalAgregarProductoVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PedidosMainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB'
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginVertical: 20
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827'
  },
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 6
  },
  selectorButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center'
  },
  selectorButtonActive: {
    backgroundColor: '#3B82F6'
  },
  selectorText: {
    color: '#374151',
    fontSize: 16
  },
  selectorTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  addButton: {
    backgroundColor: '#007BFF',
    borderRadius: 30,
    width: 40,
    height: 40,
    padding:5
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 10, 10, 0.4)'
  },
  modalContent: {
    margin: 20,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24
  },
  fullList: {
    flex: 1
  }
});
