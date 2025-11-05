import './App.css';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompress, faExpand } from '@fortawesome/free-solid-svg-icons'


import ChatRoom from './Components/chatroom.js';
import TicTacToe from './Components/TicTacToe.js';
import Otrio from './Components/otrio.js';

import Minesweeper from './Components/minesweeper.js';
import WebRTC from './Components/webRTC.js';
import RTC from './Components/RPCreplication.js';
import TowerDefense from './Components/towerDefense/TD.js';

import CaesarsCalendar from './Components/CaesarsCalendar.js';


import { SignIn, LogOut } from './Components/credentials.js';


import { useSearchParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import Carpool from './Components/carpool.js';


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
  const [headerHidden, setHeaderHidden] = useState(false);
  
  return (
    <div className="App">
      <header className="App-header" style={headerHidden ? {display: 'none'} : {}} >
        {!headerHidden && 
        <>
        <h1>Diego Martínez</h1>
        <div className='menu'>
          {<button className='important menu-button' onClick={() => window.open('https://docs.google.com/presentation/d/1QwhlehQNZDBa3j2jfsT2TqT-PblCNuOtctviu9lH49U/edit?usp=sharing', '_blank')}>発表</button>}
          <button className={`chat-button menu-button ${user ? '' : 'loginRequired'}`} onClick={() => setSearchParams({tab: "chat"})}>Chat</button>
          <button className={`tictactoe-button menu-button menu-button ${user ? '' : 'loginRequired'}`} onClick={() => setSearchParams({tab: "tictactoe"})}>Tic Tac Toe</button>
          {user && <button className='otrio-button menu-button hidden' onClick={() => setSearchParams({tab: "otrio"})}>Otrio</button>}

          <button className='minesweeper-button menu-button' onClick={() => setSearchParams({tab: "minesweeper"})}>Minesweeper</button>
          {user && <button className='menu-button hidden' onClick={() => setSearchParams({tab: "RTC"})}>RTC</button>}
          {user && <button className='menu-button hidden' onClick={() => setSearchParams({tab: "RTC2"})}>RTC2</button>}
          <button className={`menu-button ${user ? '' : 'loginRequired'}`} onClick={() => setSearchParams({tab: "Carpool"})}>Carpool</button>
          <button className='menu-button' onClick={() => setSearchParams({tab: "3js"})}>3js</button>
          {user && <button className='menu-button' onClick={() => setSearchParams({tab: "CaesarsCalendar"})}>Caesars Calendar</button>}
          {!user && <button className='menu-button' onClick={() => setSearchParams({tab: "signIn"})}>signIn</button>}
          {user && <LogOut/>}

        </div>
        <FontAwesomeIcon className='fullScreenButton' icon={faCompress} onClick={() => setHeaderHidden(true)} style={{ float: 'right' }} />
        </>}

      </header>
      {headerHidden && <FontAwesomeIcon className='fullScreenButton' icon={faExpand} onClick={() => setHeaderHidden(false)}/>}

        {user && (currentTab === 'chat') && (<ChatRoom />) }
        {user && (currentTab === 'tictactoe') && (<TicTacToe />) }
        {user && (currentTab === 'otrio') && (<Otrio />) }

        { (currentTab === 'minesweeper') && (<Minesweeper />) }
        {user && (currentTab === 'RTC') && (<WebRTC />) }
        {user && (currentTab === 'RTC2') && (<RTC />) }
        {user && (currentTab === 'Carpool') && (<Carpool />) }
        {(currentTab === '3js') && (<TowerDefense />) }
        {!user && (currentTab === 'signIn') && (<SignIn />) }
        {(currentTab === 'CaesarsCalendar') && (<CaesarsCalendar />) }
    </div>
  );
}

export default App;