import { set } from "firebase/database";
import React, { useState, useEffect } from "react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BoardData = 
    [["Jan", 'Feb', "Mar", "Apr", "May", "Jun", "X"],
     ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "X"],
     ["1",   "2",   "3",   "4",   "5",   "6",   "7"],
     ["8",   "9",   "10",  "11",  "12",  "13",  "14"],
     ["15",  "16",  "17",  "18",  "19",  "20",  "21"],
     ["22",  "23",  "24",  "25",  "26",  "27",  "28"],
     ["29",  "30",  "31",  "Sun", "Mon", "Tue", "Wed"],
     ["X",   "X",   "X",   "X",   "Thu", "Fri", "Sat"]];

const Pieces = [
    [[1,1,0],
     [1,1,1]],
    [[1,1],
     [1,0],
     [1,1]],
    [[1,1,1],
     [0,1,0],
     [0,1,0]],
    [[1,0],
     [1,0],
     [1,1]],
    [[1,0],
     [1,0],
     [1,0],
     [1,1]],
    [[1,1,1],
     [0,0,1],
     [0,0,1]],
    [[0,1,1],
     [1,1,0]],
    [[1,1,0],
     [0,1,0],
     [0,1,1]],
    [[1,0],
     [1,1],
     [0,1],
     [0,1]],
    [[1],
     [1],
     [1],
     [1]]
];

const printBoard = (board) => {
    for (let i = 0; i < board.length; i++) {
        let row = "";
        for (let j = 0; j < board[i].length; j++) {
            row += board[i][j] + " ";
        }
        console.log(row);
    }
}

const rotatePiece = (piece) => {
    const rotatedPiece = [];
    for (let j = 0; j < piece[0].length; j++) {
        rotatedPiece[j] = [];
        for (let i = piece.length - 1; i >= 0; i--) {
            rotatedPiece[j][i] = piece[i][j];
        }
    }
    return rotatedPiece;
}

const mirrorPiece = (piece) => {
    const mirroredPiece = [];
    for (let i = 0; i < piece.length; i++) {
        mirroredPiece[i] = [];
        for (let j = piece[0].length - 1; j >= 0; j--) {
            mirroredPiece[i][j] = piece[i][j];
        }
    }
    return mirroredPiece;
}


export default function CaesarsCalendar() {

    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDOW, setSelectedDOW] = useState(null);

    const [board, setBoard] = useState(BoardData);

    function getPieces(month, day, DOW, board = null, index = 0) {
        let piece = Pieces[index];

        const spaceSafe = (space) => {
            if (
                space !== "X" &&
                space !== month &&
                space !== day &&
                space !== DOW &&
                !(typeof space === "string" && space.startsWith("t"))
            ) {
                return true;
            }
            return false;
        };

        const checkPiece = (piece) => {
            for (let y = 0; y < board.length; y++) {
                for (let x = 0; x < board[y].length; x++) {
                    if (!spaceSafe(board[y][x])) {
                        continue;
                    }
                    let canPlace = true;
                    for (let i = 0; i < piece.length; i++) {
                        for (let j = 0; j < piece[i].length; j++) {
                            if (piece[i][j] === 1) {
                                if (
                                    y + i >= board.length ||
                                    x + j >= board[y].length ||
                                    !spaceSafe(board[y + i][x + j])
                                ) {
                                    canPlace = false;
                                    break;
                                }
                            }
                        }
                        if (!canPlace) {
                            break;
                        }
                    }
                    if (canPlace) {
                        // Deep copy the board before modifying
                        let newBoard = board.map(row => [...row]);
                        for (let i = 0; i < piece.length; i++) {
                            for (let j = 0; j < piece[i].length; j++) {
                                if (piece[i][j] === 1) {
                                    newBoard[y + i][x + j] = `t${index}`;
                                }
                            }
                        }
                        setBoard(newBoard);
                        getPieces(month, day, DOW, newBoard, index + 1);
                        // No need to revert newBoard, as it's a copy
                    }
                }
            }
        };

        if (index === 2) {
            console.log("Did we win?");
            printBoard(board);
            return true;
        }

        if (!board) {
            // Deep copy Board to board
            board = BoardData.map(row => [...row]);
        }

        for (let i = 0; i < 4; i++) {
            checkPiece(piece);
            piece = rotatePiece(piece);
        }
        piece = mirrorPiece(piece);
        for (let i = 0; i < 4; i++) {
            checkPiece(piece);
            piece = rotatePiece(piece);
        }
    }

    useEffect(() => {
        if (selectedMonth && selectedDate && selectedDOW) {
            getPieces(selectedMonth, selectedDate, selectedDOW);
        }
    }, [selectedMonth, selectedDate, selectedDOW]);

    return (
        <div className="CaesarsCalendar">
            <style>
                {`
                    .CaesarsCalendar {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        height: 100vh;
                    }
                    .month-buttons {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                    .month-buttons button {
                        margin: 5px;
                        padding: 10px 20px;
                        font-size: 16px;
                    }
                    .selected {
                        background-color: #007BFF;
                        color: white;
                    }
                    .date-buttons {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        margin-top: 20px;
                    }
                    .date-buttons button {
                        margin: 3px;
                        padding: 8px 14px;
                        font-size: 14px;
                    }
                    .dow-buttons {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        margin-top: 20px;
                    }
                    .dow-buttons button {
                        margin: 3px;
                        padding: 8px 14px;
                        font-size: 14px;
                    }
                    .board {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 5px;
                        margin-top: 20px;
                    }
                    .board-row {
                        display: contents;
                    }
                `}
            </style>

            <h1>Caesar's Calendar</h1>
            <div className="month-buttons">
                {months.map((month, idx) => (
                    <button
                        key={idx}
                        className={selectedMonth === month ? "selected" : ""}
                        onClick={() => setSelectedMonth(month)}
                    >
                        {month}
                    </button>
                ))}
            </div>
            {selectedMonth !== null && (
                <div className="date-buttons">
                    {[...Array(31)].map((_, i) => (
                        <button
                            key={i}
                            className={selectedDate === `${i + 1}` ? "selected" : ""}
                            onClick={() => setSelectedDate(`${i + 1}`)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
            {selectedDate !== null && (
                <div className="dow-buttons">
                    {daysOfWeek.map((dow, idx) => (
                        <button
                            key={idx}
                            className={selectedDOW === dow ? "selected" : ""}
                            onClick={() => {
                                setSelectedDOW(dow);
                                getPieces(selectedMonth, selectedDate, dow);
                            }}
                        >
                            {dow}
                        </button>
                    ))}
                </div>
            )}

            {selectedDOW !== null && (
                <div className="board">
                    {board.map((row, rowIndex) => (
                        <div key={rowIndex} className="board-row">
                            {row.map((cell, cellIndex) => (
                                <div key={cellIndex} className={`board-cell ${cell}`}>
                                    {cell}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}