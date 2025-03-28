import { Image, Text, TouchableOpacity, View, StyleSheet, Alert } from "react-native";
import React from "react";
import { db } from "../../firebase/firebaseConfig";
import { ref, remove } from "firebase/database";

const DetalleProductosScreen = ({ navigation, route }: any) => {
  const { producto } = route.params || {};

  const confirmarEliminacion = () => {
    Alert.alert(
      "Eliminar Producto",
      "¿Estás seguro de que deseas eliminar este producto?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: eliminarProducto },
      ],
      { cancelable: true }
    );
  };

  const eliminarProducto = () => {
    const productoRef = ref(db, `productos/${producto.id}`);
    remove(productoRef)
      .then(() => {
        Alert.alert("Éxito", "El producto ha sido eliminado correctamente.");
        navigation.navigate("ProductosMain");
      })
      .catch((error) => {
        Alert.alert("Error", "Hubo un problema al eliminar el producto.");
        console.error("Error al eliminar el producto:", error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalles del Producto</Text>

      <Image source={{ uri: producto.imagen }} style={styles.imagen} />

      <View style={styles.infoContainer}>
        <Text style={styles.nombre}>{producto.nombre}</Text>
        <Text style={styles.precio}>Precio: ${producto.precio}</Text>
      </View>

      <TouchableOpacity
        style={[styles.boton, styles.editar]}
        onPress={() => navigation.navigate("EditarProducto", { productoE: producto })}
      >
        <Text style={styles.textoBoton}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.boton, styles.eliminar]}
        onPress={confirmarEliminacion}
      >
        <Text style={styles.textoBoton}>Eliminar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.boton, styles.regresar]}
        onPress={() => navigation.navigate("ProductosMain")}
      >
        <Text style={styles.textoBoton}>Regresar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DetalleProductosScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f4f8",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  imagen: {
    width: 180,
    height: 180,
    borderRadius: 15,
    marginBottom: 20,
    backgroundColor: "#ddd",
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    width: "90%",
  },
  nombre: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#444",
    textAlign: "center",
    marginBottom: 5,
  },
  precio: {
    fontSize: 18,
    fontWeight: "600",
    color: "#777",
  },
  boton: {
    width: "85%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  editar: {
    backgroundColor: "#4CAF50",
  },
  eliminar: {
    backgroundColor: "#E63946",
  },
  regresar: {
    backgroundColor: "#1E88E5",
  },
  textoBoton: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});