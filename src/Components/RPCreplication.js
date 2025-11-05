import React, { useEffect, useRef, useState } from 'react';
import { auth } from '../App.js';
import { getDatabase, ref, onValue, push, set, onDisconnect, update, get } from "firebase/database";
import { useObject, useList } from 'react-firebase-hooks/database';

const servers = {
    iceServers: [
        {
            urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
        }
    ],
    iceCandidatePoolSize: 10,
};

const RoomDisplay = ({ joinRoom }) => {
    const [roomsData, loadingRooms] = useList(ref(getDatabase(), 'RTC/rooms'));
    return (
        <>
        <button onClick={() => joinRoom(auth.currentUser.uid)}>Create Room</button>

        {roomsData && !loadingRooms && roomsData.map((room) => (
            <div key={room.key}>
                <span>{room.key}</span>
                <button onClick={() => joinRoom(room.key)}>Join Room</button>
            </div>
        ))}
        </>
    )
}

const Peer = ({ peerID }) => {
    return (
        <div>
            <span>{peerID}</span>
        </div>
    )
}

export default function WebRTC() {
    const [inRoom, setInRoom] = useState(false);
    let currentRoom = null;
    let peers = useRef({});
    let dataChannels = useRef({});

    function createOffer(peerID) {
        // Create Peer
        let peer = new RTCPeerConnection(servers);
        
        peer.onsignalingstatechange = (event) => {
            console.log("Signaling state change:", peer.signalingState, event);
        }

        // Create data channel
        const dataChannel = peer.createDataChannel("sendChannel");
        dataChannel.onopen = () => {
            console.log("Data channel is open");
        };
        dataChannel.onmessage = (event) => {
            console.log("Got message:", event.data);
        };
        dataChannel.onclose = () => { console.log("Data channel closed") };
        
        dataChannels.current[peerID] = dataChannel;
        

        // Add offer ice candidate (local ice candidate)
        const candidateRef = ref(getDatabase(), `RTC/rooms/${currentRoom}/offers/${peerID}/${auth.currentUser.uid}/offerCandidates`);
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                const candidateData = event.candidate.toJSON();
                
                push(candidateRef, candidateData);
            }
        };
        

        // Create and send offer (local description)
        const peerRef = ref(getDatabase(), `RTC/rooms/${currentRoom}/offers/${peerID}/${auth.currentUser.uid}`);
        peer.createOffer().then((offer) => {
            return peer.setLocalDescription(offer);
        }).then(() => {
            // Send offer to the other peer using signaling
            set(peerRef, {
                offer: {
                    type: peer.localDescription.type,
                    sdp: peer.localDescription.sdp,
                },
            });
        }).catch((error) => {
            console.error("Error creating offer: ", error);
        });


        // Detect and set answer (remote description)
        const answerRef = ref(getDatabase(), `RTC/rooms/${currentRoom}/offers/${peerID}/${auth.currentUser.uid}/answer`);
        onValue(answerRef, (snapshot) => {
            const data = snapshot.val();

            if (data && !peer.remoteDescription) {
                console.log("Setting remote description");
                const answer = new RTCSessionDescription(data);
                peer.setRemoteDescription(answer);
            }
        });


        // Detect and add answer candidates (remote ice candidates)
        const answerCandidatesRef = ref(getDatabase(), `RTC/rooms/${currentRoom}/offers/${peerID}/${auth.currentUser.uid}/answerCandidates`);
        onValue(answerCandidatesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                for (const candidate of Object.values(data)) {
                    peer.addIceCandidate(new RTCIceCandidate(candidate));
                }
            }
        }); 

        peers.current[peerID] = peer;
    };


    function createAnswer(peerID, offerData) {
        // Create Peer
        let peer = new RTCPeerConnection(servers);
        
        peer.onicecandidateerror = (event) => {
            console.log("Ice candidate error:", event);
        }

        // Detect and create data channels (remote peer)
        peer.ondatachannel = (event) => {
            console.log("Data channel created");
            const dataChannel = event.channel;
            dataChannel.onopen = () => {
                console.log("Data channel is open");
            };
            dataChannel.onmessage = (event) => {
                console.log("Got message:", event.data);
            };
            dataChannel.onclose = () => { console.log("Data channel closed") };
            dataChannels.current[peerID] = dataChannel;
        };
        
        // Add answer ice candidate (local ice candidate)
        const candidateRef = ref(getDatabase(), `RTC/rooms/${currentRoom}/offers/${auth.currentUser.uid}/${peerID}/answerCandidates`);
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                const candidateData = event.candidate.toJSON();
                
                push(candidateRef, candidateData);
            }
        };
        
        // Create answer from offer (remote description)
        const peerRef = ref(getDatabase(), `RTC/rooms/${currentRoom}/offers/${auth.currentUser.uid}/${peerID}`);
        const offer = new RTCSessionDescription(offerData);
        peer.setRemoteDescription(offer).then(() => {
            return peer.createAnswer();
        }).then((answer) => {
            return peer.setLocalDescription(answer);
        }).then(() => {
            // Send answer to the other peer using signaling
            const roomWithAnswer = {
                answer: {
                    type: peer.localDescription.type,
                    sdp: peer.localDescription.sdp
                }
            };
            update(peerRef, roomWithAnswer);
        }).catch((error) => {
            console.error("Error joining room: ", error);
        });

        // Detect and set remote offer ice candidates
        const offerCandidatesRef = ref(getDatabase(), `RTC/rooms/${currentRoom}/offers/${auth.currentUser.uid}/${peerID}/offerCandidates`);
        onValue(offerCandidatesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                for (const candidate of Object.values(data)) {
                    peer.addIceCandidate(new RTCIceCandidate(candidate));
                }
            }
        });

        peers.current[peerID] = peer;
    }


    function joinRoom(roomID){
        currentRoom = roomID;
        setInRoom(true);
        const roomRef = ref(getDatabase(), `RTC/rooms/${roomID}`);

        get(roomRef).then((snapshot) => {
            if (!snapshot.exists()) { return; }

            const roomData = snapshot.val();
            for (const peerID in roomData.players) {
                if (peerID === auth.currentUser.uid) { continue; }
                console.log("Creating peer for existing ", peerID);
                createOffer(peerID);
            }
        });

        const playerRef = ref(getDatabase(), `RTC/rooms/${roomID}/players/${auth.currentUser.uid}`);
        set(playerRef, {
            name: auth.currentUser.displayName,
        });
        

        const offersRef = ref(getDatabase(), `RTC/rooms/${roomID}/offers/${auth.currentUser.uid}`);
        onValue(offersRef, (snapshot) => {
            if (!snapshot.val()) { return; }
            const offers = snapshot.val();

            for (const peerID in offers) {
                if (peers.current[peerID]) { continue; }
                createAnswer(peerID, offers[peerID].offer);
            }
        });
    }

    function sendMessage(message) {
        console.log("Sending message:", message, "to", dataChannels.current);
        console.log(peers.current)
        for (const dataChannel of Object.values(dataChannels.current)) {
            if (dataChannel.readyState === "open") {
                dataChannel.send(message);
            } else {
                console.log("Data channel not open. State:", dataChannel.readyState);
            }
                
        }
    }

    

    return (
        <div>
            <h1>WebRTC</h1>
            <button onClick={() => console.log(peers.current)}>Current Peers</button>
            {inRoom && <>
                <button onClick={() => {
                    const message = document.getElementById('message').value;
                    sendMessage(message)
                }}>Send Message</button>
                <input type="text" id="message" placeholder="Message"></input>
            </>}

            {!inRoom && <RoomDisplay joinRoom={(room) => joinRoom(room)}/>}
        </div>
    );
}