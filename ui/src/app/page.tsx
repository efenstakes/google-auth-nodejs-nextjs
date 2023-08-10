"use client"


import { auth, initiateSignInWithGoogle } from "@/auth/auth"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"


import styles from './page.module.css'
import { useContext } from "react"
import { ProfileContext } from "@/providers/profile"

export default function Home() {
  const { profile, isLoading, hasError, updateProfileData } = useContext(ProfileContext)

  const signinWithGoogle = async ()=> {
    console.log("sign in")
    
    try {
      const res = await signInWithPopup(auth, new GoogleAuthProvider())
      console.log("res")
      console.log(res)

      console.log("res ", res['_tokenResponse']['idToken'])
      console.log("keys ", Object.keys(res.user))

      const token = res['_tokenResponse']['idToken']

      const req = await fetch("http://localhost:4444/authenticate", {
        method: 'POST',
        body: JSON.stringify({
          token,
        }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      })
      const resJson = await req.json()
      console.log("resJson ", resJson)

      updateProfileData(resJson.result)
    } catch (error) {
      console.log("error in signinWithGoogle ", error)
    }

  }

  return (
    <div className={styles.page}>
      {
        !profile &&
          <button
            onClick={signinWithGoogle}
            className={styles.signInButton}
          >
            Sign In With Google
          </button>
      }
      {
        profile &&
          <div className={styles.userDetails}>
            
            <h1> Welcome </h1>

            <h2> { profile?.name } </h2>
            <h2> { profile?.email } </h2>

            <button
              onClick={()=> updateProfileData(null)}
              className={styles.signInButton}
            >
              LogOut
            </button>

          </div>
      }
    </div>
  )
}
