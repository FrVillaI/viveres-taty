import { StyleSheet, Text, View, FlatList, Switch } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';

type Pedido = {
  id: string;
  nombre: string;
  fecha: string;
  realizado: boolean;
};

type Producto = {
  id: string;
  nombre: string;
  cantidad: number;
};


const PedidosMainScreen = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    const db = getDatabase();

    const pedidosRef = ref(db, 'pedidos');
    onValue(pedidosRef, (snapshot) => {
      const data = snapshot.val();
      const pedidosList = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setPedidos(pedidosList);
    });

    const productosRef = ref(db, 'productosDeseados');
    onValue(productosRef, (snapshot) => {
      const data = snapshot.val();
      const productosList = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setProductos(productosList);
    });
  }, []);

  const toggleEstadoPedido = async (id: string, estadoActual: boolean) => {
    const db = getDatabase();
    await update(ref(db, `pedidos/${id}`), {
      realizado: !estadoActual
    });
  };
  

  const renderPedido = ({ item }: { item: Pedido }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.nombre}</Text>
      <Text>Fecha: {item.fecha}</Text>
      <View style={styles.row}>
        <Text>{item.realizado ? 'Realizado ✅' : 'Pendiente ⭕️'}</Text>
        <Switch
          value={item.realizado}
          onValueChange={() => toggleEstadoPedido(item.id, item.realizado)}
        />
      </View>
    </View>
  );

  const renderProducto = ({ item }: { item: Producto }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🛒 {item.nombre}</Text>
      <Text>Cantidad: {item.cantidad}</Text>
    </View>
  );


  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Lista de Pedidos</Text>
      <FlatList
        data={pedidos}
        renderItem={renderPedido}
        keyExtractor={(item) => item.id}
      />

      <Text style={styles.title}>📝 Lista de Compras</Text>
      <FlatList
        data={productos}
        renderItem={renderProducto}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

export default PedidosMainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
    marginTop: 30
  },
  card: {
    backgroundColor: '#f4f4f4',
    padding: 12,
    borderRadius: 10,
    marginVertical: 5
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  }
});
