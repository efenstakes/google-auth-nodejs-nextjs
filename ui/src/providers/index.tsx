"use client"
import React from 'react'
import ProfileProvider from './profile'

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <ProfileProvider>
            {children}
        </ProfileProvider>
    )
}

export default Providers
