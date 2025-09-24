import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSearchPress?: () => void;
  placeholder?: string;
};

export default function SearchBar({ value, onChangeText, onSearchPress, placeholder = "ابحث..." }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Feather name="search" size={22} color="#888" style={{ marginHorizontal: 10 }} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={value}
          onChangeText={onChangeText}
          textAlign={I18nManager.isRTL ? 'right' : 'left'}
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={onSearchPress}>
        <Feather name={I18nManager.isRTL ? "arrow-left" : "arrow-right"} size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    paddingHorizontal: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginHorizontal: 5,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
});
