import { StyleSheet, Text, View } from 'react-native'
import { Stack } from 'expo-router/stack'
import React from 'react'
import SocketProvider from '../src/providers/socket_provider'
import ProfileProvider from '../src/providers/profile_provider'

const AppLayout = () => {
    return (
        <SocketProvider>
            <ProfileProvider>
                <Stack>
                    
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="home" options={{ headerShown: false }} />
                </Stack>
            </ProfileProvider>
        </SocketProvider>
    )
}

export default AppLayout

const styles = StyleSheet.create({})