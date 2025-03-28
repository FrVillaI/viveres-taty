import { StyleSheet, Text, TouchableOpacity, View, Modal, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ref, onValue, push, set } from "firebase/database";
import { db } from '../../firebase/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, TextInput } from 'react-native-gesture-handler';
import { AntDesign } from '@expo/vector-icons';

interface Deuda {
  id: string;
  nombre: string;
  total_deuda: number;
}

const DeudasMainScreen = ({ navigation }: any) => {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredDeudas, setFilteredDeudas] = useState<Deuda[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newDeudorName, setNewDeudorName] = useState<string>('');

  // Carga de datos
  useEffect(() => {
    const deudasRef = ref(db, "deudas");
    const unsubscribe = onValue(
      deudasRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const deudasData: Deuda[] = [];
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            deudasData.push({
              id: childSnapshot.key!,
              nombre: data.nombre,
              total_deuda: data.total_deuda,
            });
          });

          setDeudas(deudasData);
          setFilteredDeudas(deudasData);
        } else {
          console.log("No hay datos en la base de datos.");
        }
      },
      (error) => {
        console.error("Error al leer datos de Firebase:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Selección de Deuda a buscar
  useEffect(() => {
    if (searchTerm) {
      const filtered = deudas.filter((deuda) =>
        deuda.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDeudas(filtered);
    } else {
      setFilteredDeudas(deudas);
    }
  }, [searchTerm, deudas]);

  // Guardar nuevo deudor en Firebase
  const saveNewDeudor = () => {
    if (newDeudorName.trim() === '') {
      Alert.alert('Error', 'Por favor ingresa un nombre válido.');
      return;
    }

    const newDeudorRef = push(ref(db, 'deudas'));
    set(newDeudorRef, {
      nombre: newDeudorName,
      total_deuda: 0,
      productos: []
    }).then(() => {
      setModalVisible(false);
      setNewDeudorName('');
      Alert.alert('Éxito', 'Deudor agregado correctamente.');
    }).catch((error) => {
      console.error("Error al guardar el deudor:", error);
      Alert.alert('Error', 'Hubo un problema al guardar el deudor.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Lista de Deudas</Text>
      <View style={styles.searchContainer}>
        <AntDesign name="search1" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Buscar deudas..."
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={(text) => setSearchTerm(text)}
        />
      </View>

      <FlatList
        data={filteredDeudas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deudaCard}
            onPress={() => navigation.navigate("DetalleDeuda", { deudaid: item.id })}
          >
            <Text style={styles.deudaName}>{item.nombre}</Text>
            <Text style={styles.deudaTotal}>${item.total_deuda.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <AntDesign name="plus" size={30} color="white" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Deudor</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del deudor"
              value={newDeudorName}
              onChangeText={(text) => setNewDeudorName(text)}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={saveNewDeudor}
            >
              <Text style={styles.modalButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonCancel}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default DeudasMainScreen;

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
    marginTop: 15,
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
  deudaCard: {
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
  deudaName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  deudaTotal: {
    fontSize: 16,
    color: "#ff0f00",
    fontWeight: "bold",
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
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
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
  modalButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonCancel: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});