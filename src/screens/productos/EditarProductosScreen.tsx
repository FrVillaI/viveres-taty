import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from "../../firebase/firebaseConfig";
import { ref, update } from "firebase/database";
import * as ImagePicker from 'expo-image-picker';
import { API_CLOUDINARY, CLOUDINARY_UPLOAD_PRESET } from '@env';

const EditarProductosScreen = ({ navigation, route }: any) => {
  const { productoE } = route.params || {};

  const [id, setId] = useState("");
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagen, setImagen] = useState("");
  const [imagenLocal, setImagenLocal] = useState("");


  useEffect(() => {
    if (productoE) {
      setId(productoE.id);
      setNombre(productoE.nombre);
      setPrecio(String(productoE.precio));
      setImagen(productoE.imagen);
    }
  }, [productoE]);

  const seleccionarImagen = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImagen(uri); // Para mostrar en vista previa
      setImagenLocal(uri); // Para saber que esta imagen aún no ha sido subida
    }
  };
  


  const subirACloudinary = async (imagenUri: string): Promise<string | null> => {
    const data = new FormData();
  
    data.append("file", {
      uri: imagenUri,
      type: "image/jpeg",
      name: "foto.jpg",
    } as any);
  
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  
    try {
      const response = await fetch(API_CLOUDINARY, {
        method: "POST",
        body: data,
      });
  
      const result = await response.json();
  
      if (result.secure_url) {
        return result.secure_url;
      } else {
        console.log("Error al subir imagen:", result);
        return null;
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
      return null;
    }
  };
  

  const guardarCambios = async () => {
    if (!nombre || !precio) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }
  
    let imagenFinal = imagen;
  
    // Si hay una imagen nueva local, súbela primero
    if (imagenLocal) {
      try {
        const urlSubida = await subirACloudinary(imagenLocal);
        if (!urlSubida) {
          Alert.alert("Error", "No se pudo subir la imagen. Intenta nuevamente.");
          return;
        }
        imagenFinal = urlSubida;
      } catch (error) {
        Alert.alert("Error", "Error al subir la imagen.");
        return;
      }
    }
  
    const productoRef = ref(db, `productos/${id}`);
    const updatedData = {
      nombre: nombre,
      precio: parseFloat(precio),
      imagen: imagenFinal,
    };
  
    update(productoRef, updatedData)
      .then(() => {
        Alert.alert("Éxito", "El producto ha sido actualizado correctamente.");
        navigation.navigate("ProductosMain");
      })
      .catch((error) => {
        Alert.alert("Error", "Hubo un problema al actualizar el producto.");
        console.error("Error al actualizar el producto:", error);
      });
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Producto</Text>

      {imagen ? (
        <Image source={{ uri: imagen }} style={styles.imagen} />
      ) : (
        <Text style={styles.textoImagen}>No hay imagen disponible</Text>
      )}

      <TouchableOpacity style={styles.botonSubir} onPress={seleccionarImagen}>
        <Text style={styles.textoBoton}>Subir nueva imagen</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Nombre:</Text>
      <TextInput
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre del producto"
      />

      <Text style={styles.label}>Precio:</Text>
      <TextInput
        style={styles.input}
        value={precio}
        onChangeText={setPrecio}
        keyboardType="numeric"
        placeholder="Precio del producto"
      />

      <TouchableOpacity style={[styles.boton, styles.editar]} onPress={guardarCambios}>
        <Text style={styles.textoBoton}>Guardar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.boton, styles.eliminar]} onPress={() => navigation.navigate("ProductosMain")}>
        <Text style={styles.textoBoton}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditarProductosScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
    marginTop: 35,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    alignSelf: "flex-start",
    marginBottom: 5,
    color: "#444",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 15,
    marginBottom: 20,
    backgroundColor: "#fff",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  imagen: {
    width: 170,
    height: 170,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  textoImagen: {
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
  },
  boton: {
    width: "85%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  botonSubir: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  editar: {
    backgroundColor: "#4CAF50",
  },
  eliminar: {
    backgroundColor: "#f44336",
  },
  textoBoton: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});