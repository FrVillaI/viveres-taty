import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { onValue, ref, update } from 'firebase/database';
import { db } from '../../firebase/firebaseConfig';
import { FlatList, Pressable, TextInput } from 'react-native-gesture-handler';

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

const EditarPedidosScreen = ({ route, navigation }: any) => {

  const pedidoid = route.params.id;

  const [pedidos, setPedidos] = useState<Pedidos | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Productos | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProduct, setEditedProduct] = useState({
    cantidad: '',
    precioUnitario: '',
    nombre: ''
  });

  console.log(pedidoid);
  

  useEffect(() => {
    const deudaRef = ref(db, `pedidos/${pedidoid}`);
    const unsubscribeDeuda = onValue(deudaRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPedidos({
          id: pedidoid,
          proveedor: data.proveedor || '',
          fecha: data.fecha || '',
          confirmacionEntrega: data.confirmacionEntrega,
          productos: data.productos || [], // ← ya es un array
        });     
        
        console.log("Yes");
        
        
      } else {
        setPedidos(null);
        console.log("Valio");
        
      }
    });
  
    return () => unsubscribeDeuda();
  }, [pedidoid]);
  

  const handleProductPress = (product: Productos) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleDelete = () => {
    if (!pedidos || !selectedProduct) return;

    Alert.alert(
      "Eliminar Producto",
      "¿Estás seguro de que quieres eliminar este producto?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          onPress: () => {
            const updatedProducts = pedidos.productos?.filter(
              p => p.id !== selectedProduct.id
            ) || [];

            update(ref(db, `pedidos/${pedidoid}`), {
              productos: updatedProducts,
            });

            setModalVisible(false);
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    if (!selectedProduct) return;

    setEditedProduct({
      cantidad: selectedProduct.cantidad.toString(),
      precioUnitario: selectedProduct.precioUnitario.toString(),
      nombre: selectedProduct.nombre
    });

    setEditMode(true);
  };

  const saveChanges = () => {
    if (!pedidos || !selectedProduct) return;

    const cantidad = parseInt(editedProduct.cantidad) || 0;
    const precio = parseFloat(editedProduct.precioUnitario) || 0;

    const updatedProducts = pedidos.productos?.map(p => {
      if (p.id === selectedProduct.id) {
        return {
          ...p,
          id: selectedProduct.id,
          cantidad,
          precioUnitario: precio,
          nombre: editedProduct.nombre || p.nombre || ''
        };
      }
      return p;
    }) || [];

    // Actualizar los productos en Firebase, incluyendo el id_producto
    update(ref(db, `pedidos/${pedidoid}`), {
      productos: updatedProducts,
    });

    setEditMode(false);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de productos del pedido</Text>

      <FlatList
        data={pedidos?.productos}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productItem}
            onPress={() => handleProductPress(item)}
          >
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{item.nombre || 'Producto sin nombre'}</Text>
              <Text style={styles.productQuantity}>
                {item.cantidad || 0} x ${(item.precioUnitario || 0).toFixed(2)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditMode(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {editMode ? (
              <>
                <Text style={styles.modalTitle}>Editar Producto</Text>

                <View style={styles.editContainer}>
                  <Text style={styles.inputLabel}>{selectedProduct?.nombre}</Text>
                  <Text style={styles.inputLabel}>Cantidad:</Text>
                  <TextInput
                    style={styles.input}
                    value={editedProduct.cantidad}
                    onChangeText={(text) => setEditedProduct({ ...editedProduct, cantidad: text })}
                    placeholder="Ej: 2"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.totalPreview}>
                    Total: ${(
                      (parseInt(editedProduct.cantidad) || 0) *
                      (parseFloat(editedProduct.precioUnitario) || 0)
                    ).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setEditMode(false)}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={saveChanges}
                  >
                    <Text style={styles.buttonText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>{selectedProduct?.nombre}</Text>
                <Text style={styles.modalText}>
                  Cantidad: {selectedProduct?.cantidad}
                </Text>
                <Text style={styles.modalText}>
                  Precio: ${(selectedProduct?.precioUnitario || 0).toFixed(2)}
                </Text>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.editButton]}
                    onPress={handleEdit}
                  >
                    <Text style={styles.buttonText}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Text style={styles.buttonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EditarPedidosScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f7f9fc",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#222",
  },
  productItem: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  productQuantity: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 25,
    width: '80%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333'
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555'
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    borderRadius: 6,
    padding: 10,
    paddingHorizontal: 20,
    elevation: 2,
    minWidth: 100,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9'
  },
  editContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 5,
    marginTop: 10,
  },
  totalPreview: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
    textAlign: 'right',
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  }
});