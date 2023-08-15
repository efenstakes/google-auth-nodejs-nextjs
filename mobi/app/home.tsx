import { Button, Pressable, StyleSheet, Text, TextInput, TouchableHighlight, View, useWindowDimensions } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
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
import { ProfileContext } from '../src/providers/profile_provider';
import { SocketContext } from '../src/providers/socket_provider';
import { ScrollView } from 'react-native-gesture-handler';


const configuration = {
    iceServers: [
      {
        urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
      },
    ],
    iceCandidatePoolSize: 10,
}
const Home = () => {
    const {width} = useWindowDimensions()
    const [ nreceiver, setNReceiver ] = useState("")
    const { name, receiver, isLoading, updateReceiver } = useContext(ProfileContext)
    const { socket, setSocketName, connect } = useContext(SocketContext)
    
    const [isCaller, setIsCaller] = useState(false)
    const [hasIncomingCall, setHasIncomingCall] = useState(false)
    const [offer, setOffer] = useState(null)
    
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [candidates, setCandidates] = useState([]);
    


    // const localPC = new RTCPeerConnection(configuration);
    const cachedLocalPC = useRef(new RTCPeerConnection(configuration))

    const [isMuted, setIsMuted] = useState(false);
    const [isOffCam, setIsOffCam] = useState(false);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        startLocalStream({ name: name, receiver, })

        return ()=> {
            cachedLocalPC.current.close()
        }
    }, [])

    useEffect(() => {
        console.log("receiver is ", receiver)

        if( isCaller ) {
            // socket.emit("start-call", { to: receiver, offer: "this", })
            startCall(receiver)
        } else {
            console.log("we have a receiver but we are not the callers")
        }

    }, [receiver])

    useEffect(() => {

        console.log("socket is ", socket)

        if( !socket ) {
            console.log("no socket")
            return
        }

        console.log('====================================');
        console.log(Object.keys(socket || {}));
        console.log('====================================');

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
        })

        socket.on('incoming-call', (data)=> {
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log("incoming call from ", data.from)
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');

            setOffer(data.offer)
            updateReceiver(data.from)
            setHasIncomingCall(true)
            // joinCall(data.offer)
            setEvents((state)=> {
                return [
                    ...state, "Got a call from "+ data.from
                ]
            })
        });

        // Listen for remote answer
        socket.on("call-accepted", ({ answer })=> {
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log("from ", receiver, " to ", name)
            console.log("call accepted answer ", answer)
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');

            setEvents((state)=> {
                return [
                    ...state, "Call accepted by "+ receiver
                ]
            })

            try {
                if( cachedLocalPC.current.signalingState == "stable" ) {
                    console.log("we already are stable ")
                    setEvents((state)=> {
                        return [
                            ...state, "Stability achieved in call-accepted "
                        ]
                    })
                    return
                }
                const rtcSessionDescription = new RTCSessionDescription(answer);
                cachedLocalPC.current.setRemoteDescription(rtcSessionDescription)

                // candidates.forEach((candidate)=> {
                  
                //     socket.emit("ice-candidate", { from: name, to: receiver, candidate, })
                // })

                setEvents((state)=> {
                    return [
                        ...state, "call accept set remote description "
                    ]
                })
            } catch (e) {
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');
                console.log("Error setting remote description ", e)
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');

                setEvents((state)=> {
                    return [
                        ...state, "Error in call accept setting remote description "
                    ]
                })

            }
        })
    
        // when answered, add candidates to peer 
        // socket.on("ice-candidate", ({ candidate })=> {
        //     console.log('====================================');
        //     console.log('====================================');
        //     console.log('====================================');
        //     console.log("got ice-candidate from SIGNAL candidate ", candidate)
        //     console.log("from ", receiver, " to ", name)
        //     console.log("cachedLocalPC ", cachedLocalPC)
        //     console.log('====================================');
        //     console.log('====================================');
        //     console.log('====================================');

        //     cachedLocalPC.addIceCandidate(new RTCIceCandidate(candidate))
        // })

        return () => {
            socket.off('connect', null);
            socket.off('disconnect', null);
            
            socket.off('incoming-call', null);
            socket.off('call-accepted', null);
            socket.off('ice-candidate', null);

            socket.off('server-check', null);
            socket.off('server-check-reply', null);
        };
    }, [socket])

    const startLocalStream = async ({ name, receiver }) => {
        // isFront will determine if the initial camera should face user or environment
        const isFront = true;
        const devices = await mediaDevices.enumerateDevices();

        const facing = isFront ? "front" : "environment";
        const videoSourceId = (devices as Array<any>).find(
            (device) => device.kind === "videoinput" && device.facing === facing
        );

        const facingMode = isFront ? "user" : "environment";
        const constraints = {
            audio: true,
            video: {
                mandatory: {
                    minWidth: 500, // Provide your own width, height and frame rate here
                    minHeight: 300,
                    minFrameRate: 30,
                },
                facingMode,
                optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
            },
        };
        const newStream = await mediaDevices.getUserMedia(constraints);
        setLocalStream(newStream)
        setEvents((state)=> {
            return [ ...state, "Created My Stream" ]
        })
        // start call
        // if( receiver && receiver.trim() != "" ) {
        //     console.log("start a call caller ", name, " receiver ", receiver)
        //     startCall(receiver)
        // }
    }


    // caller here
    const startCall = async (receiver) => {
        setIsCaller(true)

        // const localPC = new RTCPeerConnection(configuration);
        localStream.getTracks().forEach((track) => {
          cachedLocalPC.current.addTrack(track, localStream);
        });

        cachedLocalPC.current.addEventListener("icecandidate", (e: any) => {
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log("startCall :: got ice candidate name ", name, " candidate ", e)
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');

            if (!e?.candidate) {
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');
                console.log("startCall :: NO final candidate!");
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');
                return;
            }
          
            // send it to websocket api
            // setCandidates((state)=> {
            //     return [ ...state, e?.candidate ]
            // })
            socket.emit("ice-candidate", { from: name, to: receiver, candidate: e?.candidate })
        });
    
        cachedLocalPC.current.ontrack = (e: any) => {
            setEvents((state)=> {
                return [ ...state, "Received remote track :: startCall" ]
            })
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log("startCall :: got remote stream ", e)
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            // const newStream = new MediaStream(e)
            // e.streams[0].getTracks().forEach((track) => {
            //     newStream.addTrack(track)
            // });
            // setRemoteStream(newStream)

            if (e.track.kind === 'video') {
                setRemoteStream(e.streams[0]);
            }
            // setRemoteStream(e.streams[0])
        };


        cachedLocalPC.current.onaddstream = (e)=> {
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log("startCall :: onaddstream ", e)
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            setEvents((state)=> {
                return [ ...state, "On add stream called :: startCall" ]
            })
        }
    
        const offer = await cachedLocalPC.current.createOffer(null)
        await cachedLocalPC.current.setLocalDescription(offer)
    
        // start call and send offer over sockets
        console.log('====================================');
        console.log('====================================');
        console.log('====================================');
        console.log("startCall :: Call ", receiver, " socket is ", socket)
        console.log('====================================');
        console.log('====================================');
        console.log('====================================');
        socket.emit("start-call", { to: receiver, offer, })
        setEvents((state)=> {
            return [ ...state, "Making Call to "+ receiver ]
        })
    
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
        socket.on("ice-candidate", async ({ candidate })=> {
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log("startCall :: got ice-candidate from SIGNAL candidate ", candidate)
            console.log("startCall :: from ", receiver, " to ", name)
            console.log("startCall :: cachedLocalPC ", cachedLocalPC)
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');

            setEvents((state)=> {
                return [ ...state, "Got ice candidate from "+ receiver ]
            })

            try {
                await cachedLocalPC.current.addIceCandidate(new RTCIceCandidate(candidate))
            } catch(e) {

                console.log('====================================');
                console.log('====================================');
                console.log('====================================');
                console.log("startCall :: Error adding candidate  ", e)
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');

                setEvents((state)=> {
                    return [ ...state, "Got ice candidate Error startCall :: " ]
                })
            }
        })
    }


    //join call function
    const joinCall = async ({ offer }) => {
        setHasIncomingCall(false)

        localStream.getTracks().forEach((track) => {
            cachedLocalPC.current.addTrack(track, localStream)
        })

        cachedLocalPC.current.addEventListener("icecandidate", (e: any) => {
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log("joinCall :: got ice candidate name ", name, " candidate ", e)
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');

            if (!e.candidate) {
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');
                console.log("joinCall :: No final candidate!");
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');
                return;
            }
            
            // send to caller
            // setCandidates((state)=> {
            //     return [ ...state, e?.candidate ]
            // })
            socket.emit("ice-candidate", { from: name, to: receiver, candidate: e?.candidate })
        });

        cachedLocalPC.current.ontrack = (e: any) => {
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log("joinCall :: got remote stream ", e)
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            // const newStream = new MediaStream();
            // e.streams[0].getTracks().forEach((track) => {
            //     newStream.addTrack(track);
            // });
            // setRemoteStream(newStream);

            setEvents((state)=> {
                return [ ...state, "joinCall:: Got remote track from "+ receiver ]
            })

            if (e.track.kind === 'video') {
                setRemoteStream(e.streams[0]);
            }

            // setRemoteStream(e.streams[0])
        };

        cachedLocalPC.current.onaddstream = (e)=> {
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log("joinCall:: onaddstream ", e);
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            setEvents((state)=> {
                return [ ...state, "joinCall:: On add stream called " ]
            })
        }

        await cachedLocalPC.current.setRemoteDescription(new RTCSessionDescription(offer));

        // create answer
        const answer = await cachedLocalPC.current.createAnswer();
        // set it as my local description
        await cachedLocalPC.current.setLocalDescription(answer);

        // send answer to caller
        socket.emit("accept-call", { answer, from: name, to: receiver })

        // listen foe candidates
        // socket.on("ice-candidate", ({ candidate })=> {
        //     localPC.addIceCandidate(new RTCIceCandidate(candidate));
        // })
        socket.on("ice-candidate", async ({ candidate })=> {
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');
            console.log("joinCall:: got ice-candidate from SIGNAL candidate ", candidate)
            console.log("joinCall:: from ", receiver, " to ", name)
            console.log("joinCall:: cachedLocalPC ", cachedLocalPC)
            console.log('====================================');
            console.log('====================================');
            console.log('====================================');

            setEvents((state)=> {
                return [ ...state, "Got ice candidate from "+ receiver ]
            })

            try {
                await cachedLocalPC.current.addIceCandidate(new RTCIceCandidate(candidate))
            } catch(e) {

                console.log('====================================');
                console.log('====================================');
                console.log('====================================');
                console.log("joinCall:: Error adding candidate  ", e)
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');

                setEvents((state)=> {
                    return [ ...state, "Error adding ice candidate from "+ receiver ]
                })
            }
        })
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
        // if (cachedLocalPC) {
        //   const senders = cachedLocalPC.getSenders();
        //   senders.forEach((sender) => {
            // cachedLocalPC.removeTrack(sender);
        //   });
        //   cachedLocalPC.close();
        // }
    
        setLocalStream(null)
        setRemoteStream(null)
        // setCachedLocalPC(null)
    }

    const rejectIncomingCall = ()=> {
        setHasIncomingCall(false)
        
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
        <ScrollView contentContainerStyle={styles.screen}>
            <Text>
                socket state {socket != null ? "Connected" : "Not Connected"}
            </Text>
            <Text>
                Me {name}
            </Text>

            <Text> Receiver { receiver } </Text>

            <Text>
                hasincoming call { hasIncomingCall ? "True" : "False" }
            </Text>
            <Text>
                is called { isCaller ? "Yes" : "NO" }
            </Text>

            {
                events.map((e, i)=> {

                    return (
                        <Text key={i}>
                            {e}
                        </Text>
                    )
                })
            }

            {
                (!receiver || receiver.trim() == "") &&
                    <View style={styles.container}>

                        <Text> Call {receiver} </Text>
                        <TextInput
                            placeholder='Call Who?'
                            onChangeText={
                                (e)=> setNReceiver(e)
                            }
                            style={styles.textInput}
                        />

                        <View style={styles.vSpace} />
                        <Button
                            title= "Call"
                            onPress={
                                ()=> {
                                    setIsCaller(true)
                                    updateReceiver(nreceiver)
                                }
                            } 
                        />

                    </View>
            }
            
            {
                localStream &&
                    <RTCView
                        streamURL={localStream.toURL()}
                        style={{
                            // width: width - 32,
                            height: 200,
                        }}
                        objectFit='cover'
                    />
            }

            {
                remoteStream &&
                    <RTCView
                        streamURL={remoteStream.toURL()}
                        style={{
                            // width: width - 32,
                            height: 200,
                            backgroundColor: 'gray',
                        }}
                        objectFit='cover'
                    />
            }
            {/* <RTCView
                streamURL={remoteStream.toURL()}
                style={{
                    width: 500,
                    height: 300,
                    backgroundColor: 'gray',
                }}
            /> */}
            {
                remoteStream != null
                    ? <Text>We have remote stream</Text>
                    : <Text>We have no remote stream</Text>
            }

            <View
                style={{
                    marginTop: 40,
                }}
            />
            
        </ScrollView>
    )
}

const IncomingCallScreen = ({ name, onAccept, onReject, })=> {

    return (
        <View style={styles.screen}>

            <Text style={styles.title1}> {name} </Text>
            <Text> Is calling.. </Text>

            <View style={styles.vSpace} />

            <View style={styles.ctas}>
                <Button
                    title = "Accept"
                    onPress = {onAccept} 
                />

                <Button
                    title = "Reject"
                    onPress = {onReject}
                    
                />
            </View>
            
        </View>
    )
}

export default Home

const styles = StyleSheet.create({

    
    screen: {
        flex: 1,
        paddingHorizontal: 16,
        display: 'flex',
        justifyContent: 'center',
        // alignItems: 'center',
    },

    container: {
        width: '100%',

    },

    textInput: {
        borderColor: '#1e1e1e',
        borderWidth: 1,
        borderRadius: 4,
        // width: '100%',
        paddingHorizontal: 10,
        paddingVertical: 4,
    },

    vSpace: {
        marginTop: 40,
    },

    ctas: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
    },

    denyCallButton: {},

    title1: {
        fontSize: 32,
    },

})
