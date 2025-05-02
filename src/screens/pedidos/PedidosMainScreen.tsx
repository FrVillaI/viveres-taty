import { StyleSheet, Text, View, FlatList, Switch, TouchableOpacity, Modal, Button, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update, push } from 'firebase/database';
import { AntDesign } from '@expo/vector-icons';
import { TextInput } from 'react-native-gesture-handler';
import { db } from '../../firebase/firebaseConfig';

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

      <Text style={styles.titleRow}> Lista de Pedidos</Text>

      <FlatList
        data={pedidos}
        renderItem={renderPedido}
        keyExtractor={(item) => item.id}
        style={styles.fullList}
      />

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalAgregarVisible(true)}
      >
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


            <TouchableOpacity style={styles.saveButton} onPress={guardarPedido}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalAgregarVisible(false)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>

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

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalProductoVisible(false)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>

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
    backgroundColor: '#F9FAFB',
  },
  titleRow: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#333",
    marginTop: 30,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  fullList: {
    marginBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    marginTop:8,
  },
  productName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#239fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: '#ff0f00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

