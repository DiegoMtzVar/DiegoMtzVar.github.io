import React, { useEffect, useState, useRef } from "react";
import { auth } from '../App.js';
import './TicTacToe.css';

const socket = require("./socket.js").default;

export default function TicTacToe() {
  const [myTurn, setMyTurn] = useState(1);
  var [currentTurn, setCurrentTurn] = useState(1);
  const [board, setBoard] = useState(Array(9).fill(" "));
  const [status, setStatus] = useState("disconnect");
  var mounted = useRef(true);


  useEffect(() => {
    return () => { 
      console.log(mounted.current);
      mounted.current = !mounted.current;
      // disconnect all events from socket
      for (let event in socket._callbacks) {
        socket.off(event);
      }
      socket.disconnect();
    }
  }, []);


  useEffect(() => {

    socket.on('wait' , () => {
      console.log('wait received');
      setStatus("wait");
    });
    socket.on('start', (turn) => {
      console.log('start received');
      setMyTurn(turn);
      setCurrentTurn(1);
      setBoard(Array(9).fill(" "));
      setStatus("start");
    });
    socket.on('move', (index) => {
      console.log('move received');
      updateBoard(index, currentTurn);
    });
    socket.on('win', () => {
      console.log('win received');
      setStatus(currentTurn !== myTurn ? "win" : "lose");
    });
    socket.on('draw', () => {
      console.log('draw received');
      setStatus("draw");
    });
  });


  function updateBoard(index, turn) {
    const newBoard = board.slice();
    newBoard[index] = turn === 1 ? "X" : "O";
    setBoard(newBoard);
    setCurrentTurn(turn === 1 ? 2 : 1);
  }

  function onBoardClick(index) {

    auth.currentUser.getIdToken(/* forceRefresh */ false).then(function(idToken) {
      socket.connect()
      socket.emit('testAuth', idToken);
      socket.disconnect();
    }).catch(function(error) {
      console.error('Error getting ID token:', error);
    });


    if (myTurn !== currentTurn || board[index] !== " ") { return; }
    updateBoard(index, myTurn);
    socket.emit('move', index);
    console.log('move sent');
  }

  return (
    <>
      <h1>Board</h1>
      {status === "win" && <h2>You win!</h2>}
      {status === "lose" && <h2>You lose!</h2>}
      {status === "draw" && <h2>It's a draw!</h2>}
      
      {status === "start" && myTurn === currentTurn && <h2>Your turn</h2>}
      {status === "start" && myTurn !== currentTurn && <h2>Opponent's turn</h2>}
      
      {status !== "disconnect" && status !== "wait" &&   
        <div className="board">
          {board.map((cell, index) => (
            <div key={index} className="tile" onClick={() => {onBoardClick(index)}}>
              {cell}
            </div>
          ))}
        </div>
      }

      {status === "disconnect" && <button onClick={() => socket.connect()}>Start</button>}
      {status === "wait" && <h2>Waiting for opponent</h2>}
      
    </>
  );
}