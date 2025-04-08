import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import React, { useState } from 'react';
import { db } from "../../firebase/firebaseConfig";
import { ref, push } from "firebase/database";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import mime from 'mime';
import { API_CLOUDINARY,CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@env';


const NuevoProductoScreen = ({ navigation }: any) => {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagen, setImagen] = useState("");

  const seleccionarImagen = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });


    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const url = await subirImagenACloudinary(uri);
      if (url) {
        setImagen(url);
      } else {
        Alert.alert("Error", "No se pudo subir la imagen.");
      }
    }
  };

  const subirImagenACloudinary = async (imagenUri: string): Promise<string | null> => {
    const data = new FormData();
    const archivo = {
      uri: imagenUri,
      type: mime.getType(imagenUri) || "image/jpeg",
      name: imagenUri.split("/").pop(),
    };
  
    data.append("file", archivo as any);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    data.append("cloud_name", CLOUDINARY_CLOUD_NAME); 
  
    try {
      const res = await fetch(API_CLOUDINARY, {
        method: "POST",
        body: data,
      });
  
      const json = await res.json();
      return json.secure_url;
    } catch (error) {
      console.error("Error al subir imagen:", error);
      return null;
    }
  };

  const guardarProducto = () => {
    if (!nombre || !precio || !imagen) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }

    const productosRef = ref(db, "productos");
    const nuevoProducto = {
      nombre,
      precio: parseFloat(precio),
      imagen,
    };

    push(productosRef, nuevoProducto)
      .then(() => {
        Alert.alert("Éxito", "Producto agregado correctamente.");
        navigation.navigate("ProductosMain");
      })
      .catch((error) => {
        Alert.alert("Error", "Hubo un problema al guardar el producto.");
        console.error("Error al agregar el producto:", error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar Producto</Text>

      {imagen ? (
        <Image source={{ uri: imagen }} style={styles.imagen} />
      ) : (
        <Text style={styles.textoImagen}>No hay imagen disponible</Text>
      )}

      <TouchableOpacity style={styles.botonSubir} onPress={seleccionarImagen}>
        <Text style={styles.textoBoton}>Subir imagen</Text>
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

      <TouchableOpacity style={[styles.boton, styles.agregar]} onPress={guardarProducto}>
        <Text style={styles.textoBoton}>Guardar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.boton, styles.cancelar]} onPress={() => navigation.navigate("ProductosMain")}>
        <Text style={styles.textoBoton}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
};
export default NuevoProductoScreen

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
  agregar: {
    backgroundColor: "#4CAF50",
  },
  cancelar: {
    backgroundColor: "#f44336",
  },
  textoBoton: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});