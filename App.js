import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState([]);
  const [currentData, setCurrentData] = useState('');
  const [updateId, setUpdateId] = useState(undefined);
  const [updating, setUpdating] = useState(false);

  const db = SQLite.openDatabase('test.db');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    db.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS table_data (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT)');
    });

    db.transaction(tx => {
      tx.executeSql('SELECT * FROM table_data', null,
        (txObj, resultSet) => setData(resultSet.rows._array),
        (txObj, error) => console.error(error));
    });
  };

  const addData = () => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO table_data (data) VALUES (?)',
        [currentData],
        (txObj, resultSet) => {
          setData(prevData => [
            ...prevData,
            { id: resultSet.insertId, data: currentData },
          ]);
          setCurrentData('');
        },
        (txObj, error) => {
          console.error(error);
        }
      );
    });
  };

  const deleteOne = (id) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM table_data WHERE id = ?',
        [id],
        () => {
          setData(prevData => prevData.filter(item => item.id !== id));
        },
        (txObj, error) => {
          console.error(error);
        }
      );
    });
  };

  const updateSetter = (id, data) => {
    setCurrentData(data);
    setUpdateId(id);
    setUpdating(true);
  };

  const updateOne = () => {
    db.transaction(tx => {
      tx.executeSql('UPDATE table_data SET data= ? WHERE id= ?', [currentData, updateId],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            loadData();
            setCurrentData('');
            setUpdating(false);
          }
        },
        (txObj, error) => console.error(error)
      );
    });
  };

  const purge = () => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM table_data', [],
        () => setData([]),
        (txObj, error) => {
          console.error(error);
        }
      );
    });
  };

  const Display = () => {
    return data.map((dt) => (
      <View key={dt.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text>{dt.data}</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => updateSetter(dt.id, dt.data)} style={{ backgroundColor: 'orange', padding: 5, borderRadius: 5, marginRight: 5 }}>
            <Text>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteOne(dt.id)} style={{ backgroundColor: 'red', padding: 5, borderRadius: 5 }}>
            <Text style={{ color: 'white' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>SQLite CRUD sample</Text>

      <View>
        {Display()}
        <TextInput value={currentData} placeholder='data' style={{ borderWidth: 1, borderRadius: 5, width: 200, marginTop: 10, padding: 5 }} onChangeText={setCurrentData} />

        <View style={{ flexDirection: 'row' }}>
          {updating ? (
            <TouchableOpacity onPress={updateOne} style={{ width: 100, padding: 5, backgroundColor: 'orange', marginTop: 5, borderRadius: 10 }}>
              <Text style={{ color: 'white', textAlign: 'center' }}>Update </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={addData} style={{ padding: 5, backgroundColor: 'green', marginTop: 5, borderRadius: 10 }}>
              <Text style={{ color: 'white' }}>Add one data</Text>
            </TouchableOpacity>
          )}
          {updating ? (
            <TouchableOpacity onPress={() => { setUpdating(false); setCurrentData('') }} style={{ width: 100, padding: 5, backgroundColor: 'red', marginTop: 5, borderRadius: 10 }}>
              <Text style={{ color: 'white', textAlign: 'center' }}>Annuler</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={purge} style={{ padding: 5, backgroundColor: 'red', marginTop: 5, borderRadius: 10 }}>
              <Text style={{ color: 'white' }}>Delete all data</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <StatusBar style="auto" />
    </View>
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
