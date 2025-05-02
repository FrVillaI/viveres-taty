import { StyleSheet, Text, View, FlatList, Switch, TouchableOpacity, Modal, Button, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update, push } from 'firebase/database';
import { AntDesign } from '@expo/vector-icons';
import { TextInput } from 'react-native-gesture-handler';
import { db } from '../../firebase/firebaseConfig';
import { useRoute } from '@react-navigation/native';

interface Pedidos {
  id: string;
  proveedor: string;
  fecha: string;
  confirmacionEntrega: boolean;
  productos: Productos[];
};

interface Productos {
  id: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

const PedidosMainScreen = ({ navigation }: any) => {
  const [pedidos, setPedidos] = useState<Pedidos[]>([]);
  const [productos, setproductos] = useState<Productos[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedidos | null>(null);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [modalProductoVisible, setModalProductoVisible] = useState(false);

  const [newproveedor, setproverdor] = useState("");
  const [newfecha, setfecha] = useState("");
  const [newconfirmacionEntrega, setconfirmacionEntrega] = useState("");
  const [newproductos, setnewproductos] = useState<Productos[]>([]);

  const [newnombre, setnewnombre] = useState("");
  const [newprecio, setnewprecio] = useState(0);
  const [newcantidad, setnewcantidad] = useState(0)

  useEffect(() => {
    const pedidosRef = ref(db, 'pedidos');
    const unsubscribe = onValue(pedidosRef, (snapshot) => {
      const pedidosData: Pedidos[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        pedidosData.push({
          id: childSnapshot.key!,
          proveedor: data.proveedor,
          fecha: data.fecha,
          confirmacionEntrega: data.confirmacionEntrega,
          productos: data.productos || []
        });
      });
      setPedidos(pedidosData);
    });

    return () => unsubscribe();
  }, []);

  const toggleEstadoPedido = async (id: string, estadoActual: boolean) => {
    await update(ref(db, `pedidos/${id}`), {
      confirmacionEntrega: !estadoActual
    });
  };

  const agregarProducto = () => {
    if (!newnombre || newprecio < 0 || newcantidad < 0) {
      Alert.alert("Error", "Nombre y precio del producto son requeridos.");
      return;
    }

    const nuevoProducto: Productos = {
      id: Date.now().toString(),
      nombre: newnombre,
      precioUnitario: newprecio,
      cantidad: newcantidad
    };

    setnewproductos([...newproductos, nuevoProducto]);
    setnewnombre("");
    setnewprecio(0);
    setnewcantidad(0);
    setModalProductoVisible(false);
  };

  const guardarPedido = async () => {
    if (!newproveedor || !newfecha) {
      Alert.alert("Error", "Todos los campos son requeridos.");
      return;
    }

    const nuevoPedido = {
      proveedor: newproveedor,
      fecha: newfecha,
      confirmacionEntrega: newconfirmacionEntrega === "true",
      productos: newproductos
    };

    try {
      await push(ref(db, "pedidos"), nuevoPedido);
      setModalAgregarVisible(false);
      setnewproductos([]);
      setproverdor("");
      setfecha("");
      setconfirmacionEntrega("");
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el pedido");
    }
  };

  const renderPedido = ({ item }: { item: Pedidos }) => (
    <TouchableOpacity style={styles.card} onPress={() => {
      setPedidoSeleccionado(item);
      setproductos(item.productos);
    }}>
      <Text style={styles.cardTitle}>{item.proveedor}</Text>
      <Text>Fecha: {item.fecha}</Text>
      <View style={styles.row}>
        <Text>{item.confirmacionEntrega ? 'Realizado ✅' : 'Pendiente ⭕️'}</Text>
        <Switch
          value={item.confirmacionEntrega}
          onValueChange={() => toggleEstadoPedido(item.id, item.confirmacionEntrega)}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.container}>

        <View style={styles.titleRow}>
          <Text style={styles.subtitle}>📦 Lista de Pedidos</Text>
        </View>

        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={(item) => item.id}
          style={styles.fullList}
        />
        <TouchableOpacity onPress={() => setModalAgregarVisible(true)} style={styles.floatingButton}>
          <AntDesign name="plus" size={30} color="white" />
        </TouchableOpacity>


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
                  <Text style={styles.cardTitle}>Pedido: {pedidoSeleccionado.proveedor}</Text>
                  <Text>Fecha: {pedidoSeleccionado.fecha}</Text>
                  <Text>Estado: {pedidoSeleccionado.confirmacionEntrega ? 'Realizado ✅' : 'Pendiente ⭕️'}</Text>

                  <FlatList
                    data={productos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.productCard}
                        onPress={() => navigation.navigate("DetalleProductos", { producto: item })}
                      >
                        <Text style={styles.productName}>{item.nombre}</Text>
                        <Text style={styles.productPrice}>${item.precioUnitario}</Text>
                      </TouchableOpacity>
                    )}
                  />

                  <View style={styles.modalButtons}>
                    <Button title="Editar" onPress={() => {
                      setPedidoSeleccionado(null);
                      navigation.navigate("editarPedidos", { id: pedidoSeleccionado.id });
                    }} />
                    <Button title="Cerrar" onPress={() => setPedidoSeleccionado(null)} color="red" />
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
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.cardTitle}>Agregar Nuevo Pedido</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Nombre del Proveedor"
                value={newproveedor}
                onChangeText={(text) => setproverdor(text)}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Fecha"
                value={newfecha}
                onChangeText={(text) => setfecha(text)}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Confirmacion entrega"
                value={newconfirmacionEntrega}
                onChangeText={(text) => setconfirmacionEntrega(text)}
              />

              <FlatList
                data={newproductos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productCard}
                  >
                    <Text style={styles.productName}>{item.nombre}</Text>
                    <Text style={styles.productPrice}>${item.precioUnitario}</Text>
                  </TouchableOpacity>
                )}

              />
              <TouchableOpacity style={styles.addButton} onPress={() => setModalProductoVisible(true)}>
                <Text style={styles.buttonText}>Agregar Productos</Text>
              </TouchableOpacity>


              <TouchableOpacity style={styles.addButton} onPress={guardarPedido}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>

              <Button title="Cerrar" onPress={() => setModalAgregarVisible(false)} />
            </View>
          </View>
        </Modal>


        <Modal
          visible={modalProductoVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.cardTitle}>Agregar Producto</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Nombre del producto"
                value={newnombre}
                onChangeText={(text) => setnewnombre(text)}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Precio unitario"
                keyboardType="numeric"
                value={newprecio.toString()}
                onChangeText={(text) => setnewprecio(parseFloat(text))}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Cantidad"
                keyboardType="numeric"
                value={newcantidad.toString()}
                onChangeText={(text) => setnewcantidad(parseFloat(text))}
              />

              <TouchableOpacity style={styles.addButton} onPress={agregarProducto}>
                <Text style={styles.buttonText}>Guardar Producto</Text>
              </TouchableOpacity>

              <Button title="Cancelar" color="red" onPress={() => setModalProductoVisible(false)} />
            </View>
          </View>
        </Modal>

      </View>
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
    padding: 5
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
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007bff",
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ scale: 1 }],
  },
  modalInput: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    margin: 8,
    width: "100%",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    overflow: "hidden",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  productPrice: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "bold",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
