import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';

// models
import IProfile from '@/models/profile';


// Create the context
export const ProfileContext = createContext({
    profile: null,
    isLoading: true,
    hasError: false,
    updateProfileData: (u)=> {},
})


const ProfileProvider = ({ children }: { children: React.ReactNode }) => {

    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [hasError, setHasError] = useState<boolean>(false)
    const [profile, setProfile] = useState<IProfile>(null)


    // Function to update user data
    const updateProfileData = (user: IProfile) => {
        setProfile(user)
        setIsLoading(false)
    }

    // Retrieve user data from local storage on initial render
    useEffect(() => {
        
    }, [])

    
    const value = useMemo(
        () => ({ profile, updateProfileData, isLoading, hasError, }), 
        [profile, isLoading, hasError]
    )
    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    )
}

export default ProfileProvider