import React, { useState } from 'react';
import { getFirestore, collection, addDoc, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { auth } from '../App';

import './chatroom.css';

function ChatMessage(props) {
  const { author, text, uid } = props.message;
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  return (
    <div className={`message ${messageClass}`}>
      <h1>{author}</h1>
      <p>{text}</p>
    </div>
  )
}

const socket = require("./socket.js").default;


export default function ChatRoom() {
  const db = getFirestore();
  const messagesQuery = query(collection(db, 'messages'),orderBy('createdAt'), limit(25));
  const [messages] = useCollectionData(messagesQuery, { idField: 'id' });
  const [formValue , setFormValue] = useState('');


  const sendMessage = async(e) => {
    e.preventDefault();
    if (!formValue) return;

    if (formValue[0] === '/') {
      const command = formValue.split(' ')[0];
      const args = formValue.split(' ').slice(1);
      if (command === '/sendEvent') {
        console.log('sendEvent', args);
        socket.connect()
        socket.emit(args[0], args[1]);
        socket.disconnect();
        return;
      } else if (command === '/testAuth')  {
        console.log('testAuth');
        auth.currentUser.getIdToken(/* forceRefresh */ false).then(function(idToken) {
          socket.connect()
          socket.emit('testAuth', idToken);
          socket.disconnect();
        }).catch(function(error) {
          console.error('Error getting ID token:', error);
        });
      }
      setFormValue('');
      return;
    }
    
    await addDoc(collection(db, 'messages'), {
      author: auth.currentUser.displayName,
      text: formValue,
      uid: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });

    setFormValue('');
    }
  
    return (
    <>
        <div className='chat-container'>
            {messages && messages.map((msg, index) => (
              <ChatMessage key={msg.id || index} message={msg} />
            ))}
        </div>
        <form className='chat-input' onSubmit={sendMessage}>
            <input className='message-input' type='text'  placeholder='Type a message...' value={formValue} onChange={(e) => setFormValue(e.target.value)}/>
            <button type='submit' className='send-button'>Send</button>
        </form> 
    </>
    )
}