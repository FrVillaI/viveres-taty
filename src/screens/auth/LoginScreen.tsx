import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { TextInput } from 'react-native-gesture-handler'
import { auth } from '../../firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth'


const LoginScreen = ({ navigation }: any) => {

  const [correo, setcorreo] = useState("")
  const [contrasenia, setcontrasenia] = useState("")

  function login() {
    signInWithEmailAndPassword(auth, correo, contrasenia)
      .then((userCredential) => {
        const user = userCredential.user;
        navigation.navigate('Tabs');
        setcorreo('');
        setcontrasenia('');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        switch (errorCode) {
          case 'auth/invalid-credential':
            Alert.alert('Error', 'Credenciales Incorrectas');
            break;
          default:
            Alert.alert('Error', errorMessage);
            break;
        }
      });
  }
  return (
    <View>
      <Text>LoginScreen</Text>
      <TextInput
        style={styles.input}
        placeholder="correo"
        value={correo}
        onChangeText={setcorreo}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={contrasenia}
        onChangeText={setcontrasenia}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => login()}
      >
        <Text>Iniciar Secion</Text>
      </TouchableOpacity>

    </View>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
  },
  input: {
    height: 40,
    width: '80%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    opacity: 0.8,
    fontSize: 16,
  }
})