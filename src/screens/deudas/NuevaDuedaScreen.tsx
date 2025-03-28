import { Image, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from "../../firebase/firebaseConfig";
import { ref, onValue, push, update, get, set } from "firebase/database";
import { AntDesign } from '@expo/vector-icons';
import { FlatList, TextInput } from 'react-native-gesture-handler';

interface Productos {
  id: string;
  imagen: string;
  nombre: string;
  precio: number;
}

interface Producto {
  id_producto: number;
  cantidad: number;
  total: number;
  fecha_prestamo: string;
  nombre?: string;
  precio_unitario: number;
}

interface Deuda {
  id: string;
  total_deuda: number;
}

const NuevaDuedaScreen = ({ navigation , route }: any) => {
  const { deudaid } = route.params || {};
  const [deuda, setDeuda] = useState<Deuda | null>(null);
  const [productos, setProductos] = useState<Productos[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredProductos, setFilteredProductos] = useState<Productos[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Productos | null>(null);
  const [cantidad, setCantidad] = useState<string>('1');

  useEffect(() => {
        const deudaRef = ref(db, `deudas/${deudaid}`);
        const unsubscribeDeuda = onValue(deudaRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setDeuda({
              id: deudaid,
              total_deuda: data.total_deuda || 0,
            });
          } else {
            setDeuda(null);
          }
        });
      
        return () => unsubscribeDeuda();
      }, [deudaid]);
  
  useEffect(() => {
    const productsRef = ref(db, 'productos');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const productosData: Productos[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        productosData.push({
          id: childSnapshot.key,
          imagen: data.imagen,
          nombre: data.nombre,
          precio: data.precio,
        });
      });
      setProductos(productosData);
      setFilteredProductos(productosData); 
    });

    return () => unsubscribe();
  }, []);

  // Filtrar productos al escribir en el buscador
  useEffect(() => {
    if (searchTerm) {
      const filtered = productos.filter((producto) =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProductos(filtered);
    } else {
      setFilteredProductos(productos);
    }
  }, [searchTerm, productos]);

  // Abrir modal con el producto seleccionado
  const openModal = (producto: Productos) => {
    setSelectedProduct(producto);
    setCantidad('1'); // Reset cantidad
    setModalVisible(true);
  };

  const agregarProducto = async () => {
    if (selectedProduct && cantidad) {
      const cantidadNum = parseInt(cantidad);
      if (cantidadNum > 0 && selectedProduct.precio) {
        const total = cantidadNum * selectedProduct.precio;
  
        // Generar un nuevo ID único basado en el tiempo (número)
        const newProductId = Date.now(); 
  
        // Crear objeto del producto
        const nuevoProducto: Producto = {
          cantidad: cantidadNum,
          fecha_prestamo: new Date().toISOString().split('T')[0],
          id_producto: newProductId,
          total: total,
          nombre: selectedProduct.nombre,
          precio_unitario: selectedProduct.precio
        };
  
        try {
          // Obtener referencia de la deuda
          const deudaRef = ref(db, `deudas/${deudaid}`);
  
          // Obtener la deuda actual
          const deudaSnapshot = await get(deudaRef);
          let totalDeudaActual = 0;
  
          if (deudaSnapshot.exists()) {
            const deudaData = deudaSnapshot.val();
            totalDeudaActual = deudaData.total_deuda || 0;
          }
  
          // Calcular el nuevo total de deuda
          const nuevoTotalDeuda = totalDeudaActual + total;
  
          // Guardar el nuevo producto
          const productosRef = ref(db, `deudas/${deudaid}/productos`);
          const newProductRef = push(productosRef);
          await set(newProductRef, nuevoProducto);
  
          // Actualizar la deuda con el nuevo total
          await update(deudaRef, { total_deuda: nuevoTotalDeuda });
  
          console.log("Producto agregado y deuda actualizada");
          setModalVisible(false);
          navigation.navigate("DetalleDeuda",{ deudaid: deudaid })
        } catch (error) {
          console.error("Error al agregar el producto:", error);
        }
      }
    }
  };
  
  
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Productos</Text>

      {/* 🔍 Input de búsqueda */}
      <View style={styles.searchContainer}>
        <AntDesign name="search1" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Buscar productos..."
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={(text) => setSearchTerm(text)}
        />
      </View>
      
      {/* 📋 Lista de productos */}
      <FlatList
        data={filteredProductos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => openModal(item)}>
            <Text style={styles.productName}>{item.nombre}</Text>
            <Image source={{ uri: item.imagen }} style={styles.productImage} />
            <Text style={styles.productPrice}>${item.precio}</Text>
          </TouchableOpacity>
        )}
      />

      {/* 🟢 Modal para agregar producto */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Producto</Text>
            {selectedProduct && (
              <>
                <Image source={{ uri: selectedProduct.imagen }} style={styles.modalImage} />
                <Text style={styles.modalText}>{selectedProduct.nombre}</Text>
                <Text style={styles.modalText}>Precio: ${selectedProduct.precio}</Text>

                <TextInput
                  style={styles.inputCantidad}
                  keyboardType="numeric"
                  value={cantidad}
                  onChangeText={setCantidad}
                  placeholder="Cantidad"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addButton} onPress={agregarProducto}>
                    <Text style={styles.buttonText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default NuevaDuedaScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f0f0f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    margin: 8,
    width: "45%",
    alignItems: "center",
    elevation: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productPrice: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "bold",
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  modalImage: {
    width: 100,
    height: 100,
    marginVertical: 10,
  },
  modalText: {
    fontSize: 16,
  },
  inputCantidad: {
    width: "50%",
    borderBottomWidth: 1,
    textAlign: "center",
    fontSize: 18,
    marginVertical: 10,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 15,
  },
  cancelButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
