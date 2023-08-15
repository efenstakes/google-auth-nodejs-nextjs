import { Button, Pressable, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { ProfileContext } from '../src/providers/profile_provider'
import { SocketContext } from '../src/providers/socket_provider'




// npx expo start --dev-client 


function getRandomItem(arr) {

    // get random index value
    const randomIndex = Math.floor(Math.random() * arr.length);

    // get random item
    const item = arr[randomIndex];

    return item;
}

const words = [ "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "m", "o", "p", "q", "r", "s", "t" ]


const buildName = ()=> {
    let name = ""

    for (let index = 0; index < 3; index++) {
        const newLetter = getRandomItem(words);
        
        name += newLetter
    }

    return name
}

const Index = () => {
    const router = useRouter()
    const [name, setName] = useState("")
    const { updateName, } = useContext(ProfileContext)
    const {setSocketName } = useContext(SocketContext)


    const goToHome = ()=> {
        updateName(name)
        setSocketName(name)
        console.log("go")
        router.push("/home")
    }

    useEffect(()=> {
        let n = buildName()
        setName(n)
        // updateName(name)
        // setSocketName(name)
    }, [])

    return (
        <View style={styles.screen}>

            <Text style={styles.text}> Hola {name} </Text>
            <TextInput
                value={name}
                placeholder='Enter Name'
                onChangeText={
                    (e)=> setName(e)
                }
                placeholderTextColor="white"
                style={styles.textInput}
            />

            <View
                style={{
                    marginTop: 40,
                }}
            />
            <Button
                title = "Proceed"
                onPress = {goToHome}
            />
            
        </View>
    )
}

export default Index

const styles = StyleSheet.create({

    screen: {
        flex: 1,
        paddingHorizontal: 16,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
    },

    text: {
        color: 'white',
    },

    textInput: {
        borderColor: 'white',
        color: 'white',
        borderWidth: 1,
        borderRadius: 4,
        width: '100%',
        paddingHorizontal: 10,
        paddingVertical: 4,
    },

})
