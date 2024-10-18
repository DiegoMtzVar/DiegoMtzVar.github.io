import './App.css';

import ChatRoom from './Components/chatroom.js';
import TicTacToe from './Components/TicTacToe.js';


import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { SignIn, LogOut } from './Components/credentials.js';

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEAUSUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);


function App() { 
  const [user] = useAuthState(auth);
  //const [currentTab, setCurrentTab] = useState('chat');
  const [searchParams, setSearchParams] = useSearchParams({tab : 'chat'});
  const currentTab = searchParams.get('tab');
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Superchat</h1>
        {user && <button className='chat-button menu-button' onClick={() => setSearchParams({tab: "chat"})}>Chat</button>}
        {user && <button className='tictactoe-button menu-button' onClick={() => setSearchParams({tab: "tictactoe"})}>Tic Tac Toe</button>}
        {user && <LogOut/>}
      </header>

        {user && (currentTab === 'chat') && (<ChatRoom />) }
        {user && (currentTab === 'tictactoe') && (<TicTacToe />) }

        {!user && <SignIn />}
    </div>
  );
}

export default App;