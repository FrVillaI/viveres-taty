import { Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from "../../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { AntDesign } from '@expo/vector-icons';

interface Productos {
  id: string;
  imagen: string;
  nombre: string;
  precio: number;
}

const ProductosMainScreen = ({ navigation }: any) => {
  const [productos, setProductos] = useState<Productos[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredProductos, setFilteredProductos] = useState<Productos[]>([]);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Productos</Text>
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

      <FlatList
        data={filteredProductos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate("DetalleProductos", { producto: item })}
          >
            <Text style={styles.productName}>{item.nombre}</Text>
            <Image source={{ uri: item.imagen }} style={styles.productImage} />
            <Text style={styles.productPrice}>${item.precio}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate("NuevoProducto")}
      >
        <AntDesign name="plus" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

export default ProductosMainScreen

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
    marginTop: 40
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
    color: "#666",
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    margin: 8,
    width: "45%",
    alignItems: "center",
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
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
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
});