/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { auth } from '../App.js';
import { getDatabase, ref, set, onDisconnect, update } from "firebase/database";
import { useObject, useList } from 'react-firebase-hooks/database';

import './styles/TicTacToe.css';

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
      if (!lobby.val().player2) {
        const lobbyObj = {
          id: lobby.key,
          player1: lobby.val().player1
        };
        lobbiesSet.add(JSON.stringify(lobbyObj));
        return lobbyObj;
      }
      return null;
    }).filter(lobby => lobby !== null);

    const uniqueLobbies = Array.from(lobbiesSet).map(lobby => JSON.parse(lobby));
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

  function computer() {
    const db = getDatabase();
    const lobbiesRef = ref(db, `TicTacToe/Lobbies`);

    set(lobbiesRef, {
      [auth.currentUser.uid]: {
        board: Array(9).fill(0),
        player1: auth.currentUser.displayName,
        player2: "Computer"
      }
    });

    onDisconnect(ref(db, `TicTacToe/Lobbies/${auth.currentUser.uid}`)).remove();
  }

  return (
    <div className="lobby-tab">

      <div className="lobby-header">
        <h1>Lobbies</h1>
        <div>
          <button className="create-button" onClick={() => {computer()}}>Computer</button>
          <button className="create-button" onClick={() => {createLobby()}}>Create Lobby</button>
        </div>
      </div>

      <ul className="Lobby-list"> 
        {lobbies && lobbies.map((lobby) => (
          <LobbyListItem key={lobby.id} player={lobby.player1} joinLobby={() => joinLobby(lobby.id)}></LobbyListItem>
        ))}
      </ul>

    </div>
  );
}


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
  //check tie
  if (board.filter(cell => cell === 0).length === 0) {
    return "Tie";
  }

  return null;
}

function Board(props) {
  const { board, updateBoard, resetGame, turn } = props;
  
  useEffect(() => {
    const winner = checkWinner(board);
    if (winner && winner !== "Tie") {
      alert(`${winner} wins!`);
      setTimeout(() => {
        resetGame();
      }, 1000);
    } else if (winner === "Tie") {
      alert("It's a tie!");
      setTimeout(() => {
        resetGame();
      }, 1000);
    }
  }, [board, resetGame]);

  return (
    <div>
      <h1>{turn}</h1>
      <div className="ttt-board">
        {board.map((cell, index) => (
          <div key={index} className={`ttt-tile ${cell}`} onClick={() => {updateBoard(index)}}>
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
      let newBoard = lobby.val().board;

      const currentTurn = newBoard.filter(cell => cell !== 0).length % 2 === 0 ? "X" : "O";
      const myTurn = auth.currentUser.displayName === lobby.val().player1 ? "X" : "O";

      if (currentTurn !== myTurn) return;

      update(boardRef, { [index]: myTurn });

      if (lobby.val().player2 === "Computer") {
        if (newBoard.filter(cell => cell === 0).length === 0 || checkWinner(newBoard)) {
          return
        }
        newBoard[index] = myTurn
        const winConditions = [
          [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
          [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
          [0, 4, 8], [2, 4, 6] // diagonals
        ];
        // Bloquear o ganar
        let block = -1
        for (let i = 0; i < winConditions.length; i++) {
          const [a, b, c] = winConditions[i];
          if (newBoard[a] !== 0 && newBoard[a] === newBoard[b] && newBoard[c] === 0) {
            block = c;
          }
          if (newBoard[a] !== 0 && newBoard[a] === newBoard[c] && newBoard[b] === 0) {
            block = b;
          }
          if (newBoard[b] !== 0 && newBoard[b] === newBoard[c] && newBoard[a] === 0) {
            block = a;
          }
        }
        if (block !== -1) {
          update(boardRef, { [block]: "O"})
          return
        }

        // Escoger mejor lugar
        const spots = [0,2,6,8,4,1,3,5,7]
        for (let i = 0; i < spots.length; i++) {
          if (newBoard[spots[i]] === 0) {
            update(boardRef, { [spots[i]]: "O"})
            return
          }
        }
      }
    }
  }

  function resetGame() {
    if (hostID !== auth.currentUser.uid) return;
    const db = getDatabase();
    const boardRef = ref(db, `TicTacToe/Lobbies/${hostID}/board`);
    set(boardRef, Array(9).fill(0));
  }

  function WaitingRoom() {
    return (
      <div>
        <h1>WaitingForPlayer...</h1>
      </div>
    );
  }

  return (
    <div className="TTT">
      {status === "findingGame" && <Lobbies setHostID={(id) => setHostID(id)} />}
      {status === "waitingForPlayer" && <WaitingRoom/>}

      {status === "inGame" && lobby && lobby.val() && 
      <Board board={lobby.val().board} 
      updateBoard={(index) => {updateBoard(index)}}
      resetGame={() => resetGame()}
      player2Name={lobby.val()}
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