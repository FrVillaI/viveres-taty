import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

type Producto = {
  id: string;
  nombre: string;
  cantidad: number;
};

const ConsideracionesMainScreen = () => {
  return (
    <View>
      <Text>consideracionesMainScreen ... Reposición de stock</Text>
    </View>
  )
}

export default ConsideracionesMainScreen

const styles = StyleSheet.create({})