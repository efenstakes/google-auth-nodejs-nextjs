import { Button, Pressable, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth'

import {
    RTCPeerConnection,
    RTCView,
    mediaDevices,
    RTCIceCandidate,
    RTCSessionDescription,
    MediaStream,
} from 'react-native-webrtc';
// import socket from './socket';

// npx expo start --dev-client 
import { io } from "socket.io-client";


const configuration = {
    iceServers: [
      {
        urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
      },
    ],
    iceCandidatePoolSize: 10,
}
let socket
const Home = () => {
    const [name, setName] = useState("")
    const [receiver, setReceiver] = useState("")
    const [isCaller, setIsCaller] = useState(false)
    const [hasIncomingCall, setHasIncomingCall] = useState(false)
    const [offer, setOffer] = useState(null)
    
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [cachedLocalPC, setCachedLocalPC] = useState(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isOffCam, setIsOffCam] = useState(false);

    useEffect(() => {
        // console.log("socket ", socket)

    }, [socket])

    useEffect(() => {

        if ( !name || name.trim() == "" ) {
            console.log("no name to connect to socket server")
        }
        
        console.log("connect to signal server")

        socket = (io as any).connect("https://b965-105-163-2-229.ngrok-free.app", {
            auth: { token: name }
        });
        socket?.connect()

        socket.on("connect", (data)=> {
            console.log("connected with data ", data)


            if( receiver && receiver.trim() != null ) {
                console.log("proceed to call")
                console.log("Call ", receiver, " socket is ", socket)
                // socket.emit("start-call", { to: receiver, offer: "this", })
                socket.emit("check-in", { message: "hola mate" })
            }
        })


        socket.on('server-check', (data)=> {
            console.log("just a server checkin data ", data)
        });

        socket.on('server-check-reply', (data)=> {
            console.log("server checkin reply data ", data)
        });
        socket.on('connect', (data)=> {
            console.log("connected with data ", data)
        });
        socket.on('disconnect', (data)=> {
            console.log("disconnected with data ", data)
        });
        socket.on('incoming-call', (data)=> {
            console.log("incoming call with data ", data)

            setHasIncomingCall(true)
            // joinCall(data.offer)
            setOffer(data.offer)
            setReceiver(data.from)
        });

        return () => {
            socket.off('connect', null);
            socket.off('disconnect', null);
            socket.off('incoming-call', null);
        };
    }, [name])

    const startLocalStream = async ({ name, receiver }) => {
        setName(name)
        setReceiver(receiver)

        // isFront will determine if the initial camera should face user or environment
        // const isFront = true;
        // const devices = await mediaDevices.enumerateDevices();

        // const facing = isFront ? "front" : "environment";
        // const videoSourceId = (devices as Array<any>).find(
        //     (device) => device.kind === "videoinput" && device.facing === facing
        // );

        // const facingMode = isFront ? "user" : "environment";
        // const constraints = {
        //     audio: true,
        //     video: {
        //         mandatory: {
        //             minWidth: 500, // Provide your own width, height and frame rate here
        //             minHeight: 300,
        //             minFrameRate: 30,
        //         },
        //         facingMode,
        //         optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
        //     },
        // };
        // const newStream = await mediaDevices.getUserMedia(constraints);
        // setLocalStream(newStream)

        // start call
        if( receiver && receiver.trim() != "" ) {
            console.log("start a call caller ", name, " receiver ", receiver)
            startCall(receiver)
        }
    }


    // caller here
    const startCall = async (receiver) => {
        setIsCaller(true)

        // const localPC = new RTCPeerConnection(configuration);
        // localStream.getTracks().forEach((track) => {
        //   localPC.addTrack(track, localStream);
        // });

        // localPC.addEventListener("icecandidate", (e: any) => {
        //     if (!e?.candidate) {
        //         console.log("Got final candidate!");
        //         return;
        //     }
          
        //     // send it to websocket api
        //     socket.emit("ice-candidate", { from: name, to: receiver })
        // });
    
        // localPC.ontrack = (e: any) => {
        //   const newStream = new MediaStream(e)
        //   e.streams[0].getTracks().forEach((track) => {
        //     newStream.addTrack(track)
        //   });
        //   setRemoteStream(newStream)
        // };
    
        // const offer = await localPC.createOffer(null)
        // await localPC.setLocalDescription(offer)
    
        // start call and send offer over sockets
        // console.log("Call ", receiver, " socket is ", socket)
        // socket.emit("start-call", { to: receiver, offer: "this", })
    
        // Listen for remote answer
        // socket.on("call-accepted", ({ answer })=> {
        //     console.log("call accepted ")
        //     const rtcSessionDescription = new RTCSessionDescription(answer);
        //     localPC.setRemoteDescription(rtcSessionDescription)
        // })
    
        // // when answered, add candidates to peer 
        // socket.on("ice-candidate", ({ candidate })=> {
        //     localPC.addIceCandidate(new RTCIceCandidate(candidate))
        // })

        // setCachedLocalPC(localPC);
    }


    //join call function
    const joinCall = async ({ offer }) => {
        setHasIncomingCall(false)

        const localPC = new RTCPeerConnection(configuration);
        localStream.getTracks().forEach((track) => {
            localPC.addTrack(track, localStream);
        });

        localPC.addEventListener("icecandidate", (e: any) => {
            if (!e.candidate) {
                console.log("Got final candidate!");
                return;
            }
            
            // send to caller
            socket.emit("ice-candidate", { from: name, to: receiver })
        });

        localPC.ontrack = (e: any) => {
            const newStream = new MediaStream(null);
            e.streams[0].getTracks().forEach((track) => {
                newStream.addTrack(track);
            });
            setRemoteStream(newStream);
        };

        await localPC.setRemoteDescription(new RTCSessionDescription(offer));

        // create answer
        const answer = await localPC.createAnswer();
        // set it as my local description
        await localPC.setLocalDescription(answer);

        // send answer to caller
        socket.emit("accept-call", { answer, from: name, to: receiver })

        // listen foe candidates
        socket.on("ice-candidate", ({ candidate })=> {
            localPC.addIceCandidate(new RTCIceCandidate(candidate));
        })

        setCachedLocalPC(localPC);
    }

    
      const switchCamera = () => {
        localStream.getVideoTracks().forEach((track) => track._switchCamera());
      };
    
      // Mutes the local's outgoing audio
      const toggleMute = () => {
        if (!remoteStream) {
          return;
        }
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = !track.enabled;
          setIsMuted(!track.enabled);
        });
      };
    
      const toggleCamera = () => {
        localStream.getVideoTracks().forEach((track) => {
          track.enabled = !track.enabled;
          setIsOffCam(!isOffCam);
        });
      };
    

    async function endCall() {
        if (cachedLocalPC) {
          const senders = cachedLocalPC.getSenders();
          senders.forEach((sender) => {
            cachedLocalPC.removeTrack(sender);
          });
          cachedLocalPC.close();
        }
    
        setLocalStream(null)
        setRemoteStream(null)
        setCachedLocalPC(null)
    }

    const rejectIncomingCall = ()=> {
        setHasIncomingCall(false)
        
    }


    if( !name ) {
        return (
            <StartScreen
                onStart={
                    (d)=> startLocalStream(d)
                }
            />
        )
    }


    if( hasIncomingCall ) {
        return (
            <IncomingCallScreen
                name={receiver}
                onAccept={
                    ()=> joinCall({offer})
                }
                onReject={
                    ()=> rejectIncomingCall()
                }
            />
        )
    }
    return (
        <View style={styles.screen}>
            <Text>
                {name}
            </Text>
            <Text>
                hasincoming call { hasIncomingCall ? "True" : "False" }
            </Text>
            
            {
                localStream &&
                    <RTCView
                        streamURL={localStream.toURL()}
                        style={{
                            width: 500,
                            height: 500,
                        }}
                    />
            }

            {
                remoteStream &&
                    <RTCView
                        streamURL={remoteStream.toURL()}
                        style={{
                            width: 500,
                            height: 500,
                        }}
                    />
            }
            {
                localStream && <Text>We have stream</Text>
            }

            <View
                style={{
                    marginTop: 40,
                }}
            />
            <View>
                <Button
                    title= "Start"
                    onPress={
                        ()=> {
                            socket = (io as any).connect("https://b965-105-163-2-229.ngrok-free.app", {
                                auth: { token: name }
                            })
                        }
                    } 
                />
            </View>
            
        </View>
    )
}



const StartScreen = ({ onStart, })=> {
    const [name, setName] = useState("")
    const [receiver, setReceiver] = useState("")


    const start = ()=> {
        onStart({name, receiver})
    }

    return (
        <View style={styles.screen}>

            <Text> Hola {name} </Text>
            <TextInput
                placeholder='Enter Name'
                onChangeText={
                    (e)=> setName(e)
                }
            />
            <Text> Call {receiver} </Text>
            <TextInput
                placeholder='Call Who?'
                onChangeText={
                    (e)=> setReceiver(e)
                }
            />

            <View
                style={{
                    marginTop: 40,
                }}
            />
            <Button
                title = "Proceed or Call"
                onPress = {start}
            />
            
        </View>
    )
}

const IncomingCallScreen = ({ name, onAccept, onReject, })=> {

    return (
        <View style={styles.screen}>

            <Text> Hola {name} is calling </Text>

            <Button
                title = "Accept"
                onPress = {onAccept} 
            />

            <Button
                title = "Reject"
                onPress = {onReject} 
            />
            
        </View>
    )
}

export default Home

const styles = StyleSheet.create({

    screen: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    }
})