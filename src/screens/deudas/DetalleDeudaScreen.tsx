import { ActivityIndicator, Button, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { FlatList } from 'react-native-gesture-handler';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { db } from "../../firebase/firebaseConfig";
import { ref, onValue, update } from "firebase/database";
import { Alert, TextInput } from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface Producto {
  id_producto: number;
  cantidad: number;
  total: number;
  fecha_prestamo: string;
  nombre: string;
  precio_unitario: number;
}

interface Deuda {
  id: string;
  nombre: string;
  total_deuda: number;
  productos: Producto[];
}


const DetalleDeudaScreen = ({ navigation, route }: any) => {
  const { deudaid } = route.params;
  const [deuda, setDeuda] = useState<Deuda | null>(null);
  const [productosMap, setProductosMap] = useState<Record<number, string>>({});
  const [pdfUri, setPdfUri] = useState('');
  const [monto, setMonto] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

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

  const generarPDF = async () => {
    if (!deuda) return;

    const html = `
      <html>
        <body>
          <h1>Detalle de Deuda</h1>
          <h2>${deuda.nombre}</h2>
          <h3>Total: $${deuda.total_deuda.toFixed(2)}</h3>
          <h4>Productos Prestados:</h4>
          <ul>
            ${deuda.productos.map(item => `
              <li>
                ${item.nombre} - Cantidad: ${item.cantidad} - Total: $${item.total.toFixed(2)} - Fecha: ${item.fecha_prestamo}
              </li>
            `).join('')}
          </ul>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      const newPath = `${FileSystem.documentDirectory}deuda.pdf`;

      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      setPdfUri(newPath);
      await compartirPDF(newPath);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    }
  };

  const compartirPDF = async (uri: string) => {
    if (uri) {
      await Sharing.shareAsync(uri);
    }
  };

  if (!deuda) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const mostrarModalPago = () => {
    setModalVisible(true);
  };

  const cancelarDeuda = (valorIngresado: string) => {
    if (!valorIngresado) {
      Alert.alert("Error", "Debe ingresar un monto válido.");
      return;
    }

    let montoRestante = parseFloat(valorIngresado);
    if (isNaN(montoRestante) || montoRestante <= 0) {
      Alert.alert("Error", "Ingrese un monto válido.");
      return;
    }

    if (!deuda) return;

    let nuevosProductos = [...deuda.productos];

    for (let producto of nuevosProductos) {
      if (montoRestante <= 0) break;

      if (montoRestante >= producto.total) {
        montoRestante -= producto.total;
        producto.total = 0;
      } else {
        producto.total -= montoRestante;
        montoRestante = 0;
      }
    }

    nuevosProductos = nuevosProductos.filter((p) => p.total > 0);
    const nuevoTotalDeuda = nuevosProductos.reduce((sum, prod) => sum + prod.total, 0);

    const deudaRef = ref(db, `deudas/${deudaid}`);
    update(deudaRef, {
      total_deuda: nuevoTotalDeuda,
      productos: nuevosProductos.length > 0 ? nuevosProductos : null,
    });

    Alert.alert("Éxito", "Deuda actualizada correctamente.");
  };


  return (
    <View style={styles.container}>

      <View style={styles.headerContainer}>
        <Text style={styles.name}>{deuda.nombre}</Text>
        <Text style={styles.total}>Total: ${deuda.total_deuda.toFixed(2)}</Text>

        <TouchableOpacity onPress={generarPDF} style={styles.saveButton}>
          <Feather name="save" size={24} color="white" />
          <MaterialIcons name="picture-as-pdf" size={24} color="white" style={{ marginLeft: 5 }} />
        </TouchableOpacity>

      </View>

      <Text style={styles.subtitle}>Productos Prestados:</Text>

      <FlatList
        data={deuda.productos}
        keyExtractor={(item) => item.id_producto?.toString()}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.nombre}</Text>
              <Text style={styles.productDetail}>Cantidad: {item.cantidad}</Text>
              <Text style={styles.productDetail}>Total: ${item.total.toFixed(2)}</Text>
              <Text style={styles.productDetail}>Fecha: {item.fecha_prestamo}</Text>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.floatingButtonAgregar, { bottom: 20 }]}
        onPress={() => navigation.navigate("NuevaDeuda",{ deudaid: deudaid })}
      >
        <AntDesign name="plus" size={30} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.floatingButtonCancelar, { bottom: 90 }]}
        onPress={mostrarModalPago}
      >
        <AntDesign name="creditcard" size={30} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.floatingButtonEditar, { bottom: 160 }]}
        onPress={() => navigation.navigate('EditarDeuda', { deudaid: deudaid })}
      >
        <AntDesign name="edit" size={30} color="white" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Ingrese el monto a pagar:</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={monto}
              onChangeText={setMonto}
            />
            <TouchableOpacity
              style={styles.buttonModalAceptar}
              onPress={() => {
                cancelarDeuda(monto);
                setModalVisible(false);
              }}
            >
              <Text style={styles.textButtonModal}>Aceptar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonModalCancelar}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textButtonModal}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default DetalleDeudaScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  total: {
    fontSize: 18,
    color: '#ff0000',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
  },
  productInfo: {
    padding: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productDetail: {
    fontSize: 14,
    color: '#555',
  },
  floatingButtonAgregar: {
    position: 'absolute',
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    right: 20,
  },
  floatingButtonCancelar: {
    position: 'absolute',
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    right: 20,
  },
  floatingButtonEditar: {
    position: 'absolute',
    backgroundColor: '#5d5d5d',
    padding: 15,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    right: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#3498db',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
  modalInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  buttonModalAceptar: {
    backgroundColor: '#27ae60',  
    paddingVertical: 10,  
    paddingHorizontal: 20,  
    borderRadius: 25, 
    alignItems: 'center',  
    justifyContent: 'center', 
    marginTop: 10, 
    marginBottom: 5,  
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonModalCancelar: {
    backgroundColor: '#95a5a6',  
    paddingVertical: 10,  
    paddingHorizontal: 20,  
    borderRadius: 25, 
    alignItems: 'center',  
    justifyContent: 'center', 
    marginTop: 10, 
    marginBottom: 5,  
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  textButtonModal: {
    color: '#FFFFFF',  
    fontSize: 16,  
    fontWeight: 'bold',  
  }
});