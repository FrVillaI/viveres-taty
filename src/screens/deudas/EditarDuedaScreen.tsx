import { Alert, StyleSheet, Text, TouchableOpacity, View, TextInput, FlatList, Modal, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { onValue, ref, update, remove } from "firebase/database";
import { db } from "../../firebase/firebaseConfig";

interface Producto {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha_prestamo: string;
  nombre: string;
}

interface Deuda {
  id: string;
  nombre: string;
  total_deuda: number;
  productos: Producto[];
}

const EditarDuedaScreen = ({ route, navigation }: any) => {
  const { deudaid, setdeudaid } = route.params;
  const [deuda, setDeuda] = useState<Deuda | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProduct, setEditedProduct] = useState({
    cantidad: '',
    precio: '',
    nombre: ''
  });

  useEffect(() => {
    const deudaRef = ref(db, `deudas/${deudaid}`);
    const unsubscribeDeuda = onValue(deudaRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDeuda({
          id: deudaid,
          nombre: data.nombre || '',
          total_deuda: data.total_deuda || 0,
          productos: data.productos ? Object.values(data.productos) : [],
        });
      } else {
        setDeuda(null);
      }
    });
  
    return () => unsubscribeDeuda();
  }, [deudaid]);

  const handleProductPress = (product: Producto) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleDelete = () => {
    if (!deuda || !selectedProduct) return;
  
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
            const updatedProducts = deuda.productos?.filter(
              p => p.id_producto !== selectedProduct.id_producto
            ) || [];
  
            const newTotal = updatedProducts.reduce(
              (sum, product) => sum + (product.total || 0), 0
            );
  
            update(ref(db, `deudas/${deudaid}`), {
              productos: updatedProducts,
              total_deuda: newTotal
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
      precio: selectedProduct.precio_unitario.toString(),
      nombre: selectedProduct.nombre
    });

    setEditMode(true);
  };

  const saveChanges = () => {
    if (!deuda || !selectedProduct) return;
  
    const cantidad = parseInt(editedProduct.cantidad) || 0;
    const precio = parseFloat(editedProduct.precio) || 0;
    const total = cantidad * precio;
  
    const updatedProducts = deuda.productos?.map(p => {
      if (p.id_producto === selectedProduct.id_producto) {
        return {
          ...p,
          id_producto: selectedProduct.id_producto, // Mantener el mismo ID
          cantidad: cantidad,
          precio_unitario: precio,
          total: total,
          nombre: editedProduct.nombre || p.nombre || ''
        };
      }
      return p;
    }) || [];
  
    const newTotal = updatedProducts.reduce(
      (sum, product) => sum + (product.total || 0), 0
    );
  
    // Actualizar los productos en Firebase, incluyendo el id_producto
    update(ref(db, `deudas/${deudaid}`), {
      productos: updatedProducts,
      total_deuda: newTotal
    });
  
    setEditMode(false);
    setModalVisible(false);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Productos</Text>

      <FlatList
        data={deuda?.productos}
        keyExtractor={(item) => item.id_producto?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productItem}
            onPress={() => handleProductPress(item)}
          >
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{item.nombre || 'Producto sin nombre'}</Text>
              <Text style={styles.productQuantity}>
                {item.cantidad || 0} x ${(item.precio_unitario || 0).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.productPrice}>${(item.total || 0).toFixed(2)}</Text>
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
                      (parseFloat(editedProduct.precio) || 0)
                    ).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.modalButtonContainer}>
                  <Pressable
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setEditMode(false)}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.button, styles.saveButton]}
                    onPress={saveChanges}
                  >
                    <Text style={styles.buttonText}>Guardar</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>{selectedProduct?.nombre}</Text>
                <Text style={styles.modalText}>
                  Cantidad: {selectedProduct?.cantidad}
                </Text>
                <Text style={styles.modalText}>
                  Precio: ${(selectedProduct?.precio_unitario || 0).toFixed(2)}
                </Text>
                <Text style={styles.modalText}>
                  Total: ${(selectedProduct?.total || 0).toFixed(2)}
                </Text>

                <View style={styles.modalButtonContainer}>
                  <Pressable
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.button, styles.editButton]}
                    onPress={handleEdit}
                  >
                    <Text style={styles.buttonText}>Editar</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Text style={styles.buttonText}>Eliminar</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

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

export default EditarDuedaScreen;