import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ProductosMainScreen from '../screens/productos/ProductosMainScreen';
import DeudasMainScreen from '../screens/deudas/DeudasMainScreen';
import DetalleDeudaScreen from '../screens/deudas/DetalleDeudaScreen';
import EditarDuedaScreen from '../screens/deudas/EditarDuedaScreen';
import NuevaDuedaScreen from '../screens/deudas/NuevaDuedaScreen';
import PedidosMainScreen from '../screens/pedidos/PedidosMainScreen';
import ConsideracionesMainScreen from '../screens/consideraciones/ConsideracionesMainScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import DetalleProductosScreen from '../screens/productos/DetalleProductosScreen';
import EditarProductosScreen from '../screens/productos/EditarProductosScreen';
import NuevoProductoScreen from '../screens/productos/NuevoProductoScreen';



const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack para manejar las pantallas de productos
function ProductosStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="ProductosMain" component={ProductosMainScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="DetalleProductos" component={DetalleProductosScreen} />
            <Stack.Screen name="EditarProducto" component={EditarProductosScreen} />
            <Stack.Screen name="NuevoProducto" component={NuevoProductoScreen} />
        </Stack.Navigator>
    );
}

// Stack para manejar las pantallas de deudas
function DeudasStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="DeudasMain" component={DeudasMainScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="DetalleDeuda" component={DetalleDeudaScreen} />
            <Stack.Screen name="EditarDeuda" component={EditarDuedaScreen} />
            <Stack.Screen name="NuevaDeuda" component={NuevaDuedaScreen} />
        </Stack.Navigator>
    );
}

// Stack para manejar las pantallas de pedidos
function PedidosStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="PedidosMain" component={PedidosMainScreen} />
        </Stack.Navigator>
    );
}

// Stack para manejar las pantallas de consideraciones
function ConsideracionesStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="ConsideracionesMain" component={ConsideracionesMainScreen} />
        </Stack.Navigator>
    );
}

// Tabs principales
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: string = 'help-circle';

                    if (route.name === 'Productos') {
                        iconName = focused ? 'cart' : 'cart-outline';
                    } else if (route.name === 'Deudas') {
                        iconName = focused ? 'cash' : 'cash-outline';
                    } else if (route.name === 'Pedidos') {
                        iconName = focused ? 'receipt' : 'receipt-outline';
                    } else if (route.name === 'Consideraciones') {
                        iconName = focused ? 'time' : 'time-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: 'blue',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Productos" component={ProductosStack} options={{ headerShown: false }} />
            <Tab.Screen name="Deudas" component={DeudasStack} options={{ headerShown: false }} />
            <Tab.Screen name="Pedidos" component={PedidosStack} options={{ headerShown: false }}/>
            <Tab.Screen name="Consideraciones" component={ConsideracionesStack} options={{ headerShown: false }}/>
        </Tab.Navigator>
    );
}

//Navegacion Principal con Login
function MainStack(){
    return(
        <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen}/>
            <Stack.Screen name="Tabs" component={MainTabs}/>
        </Stack.Navigator>
    );
}

// Agregar el NavigationContainer
export default function MainNavigators() {
    return (
        <NavigationContainer>
            <MainTabs/>
        </NavigationContainer>
    );
}
