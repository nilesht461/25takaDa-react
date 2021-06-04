
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createStore } from 'redux'
import updateTripReducer from './redux/reducers/trips';
import { Provider as StoreProvider } from 'react-redux'
import Navigator from './routes/tabNavigation';
export default function App() {
  const store = createStore(updateTripReducer)
  return (
    <StoreProvider store={store}>
    <Navigator />
  </StoreProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
