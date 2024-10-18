/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { auth } from '../App.js';
import { getDatabase, ref, onValue, push, set, onDisconnect, update } from "firebase/database";
import { useObject, useList } from 'react-firebase-hooks/database';

import './TicTacToe.css';

function LobbyListItem(props) {
  const player = props.player;
  
  return (
    <div className="lobbyLI" onClick={() => props.joinLobby(player)}>
      <h2>{player}</h2>
      <button className="join-button">Join</button>
    </div>
  );
}

function Lobbies(props){
  const [lobbiesList, loading, error] = useList(ref(getDatabase(), 'TicTacToe/Lobbies'));
  const [lobbies, setLobbies] = useState([]);

  useEffect(() => {
    if (loading || !lobbiesList) return;

    const lobbiesSet = new Set();
    const lobbies = lobbiesList.map((lobby) => {
      const lobbyObj = {
        id: lobby.key,
        player1: lobby.val().player1
      };
      lobbiesSet.add(JSON.stringify(lobbyObj));
      return lobbyObj;
    });

    const uniqueLobbies = Array.from(lobbiesSet).map(lobby => JSON.parse(lobby));
    console.log(uniqueLobbies);
    setLobbies(uniqueLobbies);
  }, [lobbiesList, loading]);


  const { setHostID } = props;

  function createLobby() {
    const db = getDatabase();
    const lobbiesRef = ref(db, `TicTacToe/Lobbies`);

    set(lobbiesRef, {
      [auth.currentUser.uid]: {
        board: Array(9).fill(0),
        player1: auth.currentUser.displayName
      }
    });

    onDisconnect(ref(db, `TicTacToe/Lobbies/${auth.currentUser.uid}`)).remove();
  }

  function joinLobby(id) {
    const db = getDatabase();
    const lobbyRef = ref(db, `TicTacToe/Lobbies/${id}`);

    update(lobbyRef, {
      player2: auth.currentUser.displayName
    });
    setHostID(id);

    onDisconnect(lobbyRef).update({player2: null});
  }

  return (
    <div className="lobby-tab">

      <div className="lobby-header">
        <h1>Lobbies</h1>
        <button className="create-button" onClick={() => {createLobby()}}>Create Lobby</button>
      </div>

      <ul className="Lobby-list"> 
        {lobbies && lobbies.map((lobby) => (
          <LobbyListItem key={lobby.id} player={lobby.player1} joinLobby={() => joinLobby(lobby.id)}></LobbyListItem>
        ))}
      </ul>

    </div>
  );
}

function WaitingRoom() {
  return (
    <div>
      <h1>WaitingForPlayer...</h1>
    </div>
  );
}


function Board(props) {
  const { board, updateBoard, resetGame, turn } = props;
  
  useEffect(() => {
    const winner = checkWinner(board);
    if (winner) {
      alert(`${winner} wins!`);
      setTimeout(() => {
        resetGame();
      }, 1000);
    }
  }, [board, resetGame]);

  function checkWinner(board) {
    const winConditions = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (let i = 0; i < winConditions.length; i++) {
      const [a, b, c] = winConditions[i];
      if (board && board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  }

  return (
    <div>
      <h1>{turn}</h1>
      <div className="board">
        {board.map((cell, index) => (
          <div key={index} className={`tile ${cell}`} onClick={() => {updateBoard(index)}}>
            {cell !== 0 ? cell : " "}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TicTacToe() {
  const [status, setStatus] = useState("findingGame");
  const [hostID, setHostID] = useState(auth.currentUser.uid);
  const [lobby, loadingLobby] = useObject(ref(getDatabase(), `TicTacToe/Lobbies/${hostID}`));

  useEffect(() => {
    if (loadingLobby) return;
    if (!lobby || !lobby.exists()) {
      setStatus("findingGame");
      setHostID(auth.currentUser.uid);
    } else if (lobby.val().player2) {
      setStatus("inGame");
    } else {
      setStatus("waitingForPlayer");
    }
  }, [lobby, loadingLobby]);
  
  function quitGame() {
    const db = getDatabase();
    const lobbyRef = ref(db, `TicTacToe/Lobbies/${hostID}`);
    
    if (hostID === auth.currentUser.uid) {
      onDisconnect(lobbyRef).cancel();
      set(lobbyRef, null);
    } else {
      onDisconnect(lobbyRef).cancel();
      update(lobbyRef, {
        player2: null
      });
      setHostID(auth.currentUser.uid);
    }
  }
  
  function updateBoard(index) {
    const db = getDatabase();
    const boardRef = ref(db, `TicTacToe/Lobbies/${hostID}/board`);

    if (lobby.val().board[index] === 0) {
      const newBoard = lobby.val().board;

      const currentTurn = newBoard.filter(cell => cell !== 0).length % 2 === 0 ? "X" : "O";
      const myTurn = auth.currentUser.displayName === lobby.val().player1 ? "X" : "O";

      if (currentTurn !== myTurn) return;

      update(boardRef, { [index]: myTurn });
    }
  }

  function resetGame() {
    if (hostID !== auth.currentUser.uid) return;
    const db = getDatabase();
    const boardRef = ref(db, `TicTacToe/Lobbies/${hostID}/board`);
    set(boardRef, Array(9).fill(0));
  }

  return (
    <div className="TTT">
      {status === "findingGame" && <Lobbies setHostID={(id) => setHostID(id)} />}
      {status === "waitingForPlayer" && <WaitingRoom/>}

      {status === "inGame" && lobby && lobby.val() && 
      <Board board={lobby.val().board} 
      updateBoard={(index) => {updateBoard(index)}}
      resetGame={() => resetGame()}
      turn={(() => {
        const currentTurn = lobby.val().board.filter(cell => cell !== 0).length % 2 === 0 ? "X" : "O";
        const myTurn = auth.currentUser.displayName === lobby.val().player1 ? "X" : "O";

        return currentTurn === myTurn ? "Your Turn" : "Opponent's Turn";
      })()}/>}

      <div className="spacer">
        {(status === "waitingForPlayer" || status === "inGame") && <button className="quit-button" onClick={() => quitGame()}>Quit</button>}
      </div>
    </div>
  );
}