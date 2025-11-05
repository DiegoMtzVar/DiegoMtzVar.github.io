import React, { useEffect, useState } from 'react';

import useMousePosition from './useMousePosition';

import './styles/minesweeper.css';
import { get } from 'firebase/database';

//import { gaussianElimination } from './gaussian';

class Tile {
    constructor() {
        this.isMine = false;
        this.isRevealed = false;
        this.isFlagged = false;
        this.surroundingMines = 0;
    }
}

function getNumberWord(number) {
    switch (number) {
        case 0: return 'zero';
        case 1: return 'one';
        case 2: return 'two';
        case 3: return 'three';
        case 4: return 'four';
        case 5: return 'five';
        case 6: return 'six';
        case 7: return 'seven';
        case 8: return 'eight';
        default: return '';
    }
}

function getTileClasses(tile) {
    const classes = ['ms-tile'];
    if (tile.isRevealed) {
        classes.push('revealed');
        if (tile.isMine) {
            classes.push('mine');
        } else {
            if (tile.isFlagged) {
                classes.push('misflagged');
            }
            classes.push(getNumberWord(tile.surroundingMines));
        }
    } else {
        if (tile.start) {
            classes.push('start');
        }
        if (tile.isFlagged) {
            classes.push('flagged');
        } else {
            classes.push('closed');
        }
    }
    if (tile.exploded) {
        classes.push('exploded');
    }
    return classes.join(' ');
}

function createBoard(rows, cols, mines) {
    const board = [];
    for (let i = 0; i < rows * cols; i++) {
        board.push(new Tile());
    }
    
    let minesPlaced = 0;
    while (minesPlaced < mines) {
        const position = Math.floor(Math.random() * rows * cols);
        if (!board[position].isMine) {
            board[position].isMine = true;
            minesPlaced++;
        }
    }

    for (let i = 0; i < rows * cols; i++) {
        if (board[i].isMine) { continue; }
        let count = 0;
        const row = Math.floor(i / cols);
        const col = i % cols;
        for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
                if (r === row && c === col) { continue; }
                if (board[r * cols + c].isMine) {
                    count++;
                }
            }
        }
        board[i].surroundingMines = count;
    }
    
    return board;
}

function getNeighbors(cols, rows, index) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const neighbors = [];
    for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
            if (r === row && c === col) { continue; }
            neighbors.push(r * cols + c);
        }
    }
    return neighbors;
}

function solveTrivial(setBoard, cols, rows) {
    setBoard((prevBoard) => {
        const newBoard = [...prevBoard];
        for (let i = 0; i < newBoard.length; i++) {
            if (!newBoard[i].isRevealed) { continue; }

            const hiddenNeighbors = getNeighbors(cols, rows, i).filter((index) => !newBoard[index].isRevealed);
            const flaggedNeighbors = hiddenNeighbors.filter((index) => newBoard[index].isFlagged);
            const unknownNeighbors = hiddenNeighbors.filter((index) => !newBoard[index].isFlagged);

            const probability = (newBoard[i].surroundingMines - flaggedNeighbors.length) / unknownNeighbors.length;
            
            if (probability === 1) {
                for (const neighbor of unknownNeighbors) {
                    newBoard[neighbor].isFlagged = true;
                }
            } else if (probability === 0) {
                for (const neighbor of unknownNeighbors) {
                    newBoard[neighbor].isRevealed = true;
                }
            }
        }
        return newBoard;
    });
}

function solveSets(setBoard, cols, rows) {
    setBoard((prevBoard) => {
        const newBoard = [...prevBoard];
        let sets = {};

        // Step 1: Collect neighbor information efficiently
        for (let i = 0; i < newBoard.length; i++) {
            if (!newBoard[i].isRevealed) continue;

            const hiddenNeighbors = getNeighbors(cols, rows, i).filter(index => !newBoard[index].isRevealed && !newBoard[index].isFlagged);

            if (hiddenNeighbors.length > 0) {
                sets[i] = hiddenNeighbors;
            }
        }

        let changed = true;
        while (changed) {
            changed = false;

            for (const key in sets) {
                const neighbors = getNeighbors(cols, rows, key);
                const unknownNeighbors = neighbors.filter(index => !newBoard[index].isRevealed && !newBoard[index].isFlagged);
                const flaggedNeighbors = neighbors.filter(index => newBoard[index].isFlagged);
                
                const myRemainingMines = newBoard[key].surroundingMines - flaggedNeighbors.length;

                // Step 2: Mark certain mines
                if (myRemainingMines === unknownNeighbors.length) {
                    for (const neighbor of unknownNeighbors) {
                        if (!newBoard[neighbor].isFlagged) {
                            newBoard[neighbor].isFlagged = true;
                            changed = true;
                        }
                    }
                }

                // Step 3: Mark certain safe tiles
                if (myRemainingMines === 0) {
                    for (const neighbor of unknownNeighbors) {
                        if (!newBoard[neighbor].isFlagged && !newBoard[neighbor].isRevealed) {
                            newBoard[neighbor].isRevealed = true;
                            changed = true;
                        }
                    }
                }

                // Step 4: Constraint Propagation between overlapping sets
                for (const neighbor of neighbors) {
                    if (!newBoard[neighbor] || !newBoard[neighbor].isRevealed) continue;

                    const neighborSet = sets[neighbor] || [];
                    const mySet = sets[key] || [];

                    if (neighborSet.length === 0 || mySet.length === 0) continue;

                    const common = neighborSet.filter(value => mySet.includes(value));
                    const neighborUnique = neighborSet.filter(value => !mySet.includes(value));
                    const myUnique = mySet.filter(value => !neighborSet.includes(value));

                    let neighborRemainingMines = newBoard[neighbor].surroundingMines - getNeighbors(cols, rows, neighbor).filter(index => newBoard[index].isFlagged).length;

                    // If all of myUnique tiles are mines, flag them
                    if (myUnique.length === myRemainingMines - neighborRemainingMines && myUnique.length > 0) {
                        for (const tile of myUnique) {
                            if (!newBoard[tile].isFlagged) {
                                //newBoard[tile].isFlagged = true;
                                changed = true;
                            }
                        }
                    }

                    // If all of neighborUnique tiles are safe, reveal them
                    if (neighborRemainingMines === 0 && neighborUnique.length > 0) {
                        for (const tile of neighborUnique) {
                            if (!newBoard[tile].isRevealed && !newBoard[tile].isFlagged) {
                                //newBoard[tile].isRevealed = true;
                                changed = true;
                            }
                        }
                    }
                }
            }
        }
        
        return newBoard;
    });
}





function boardToMatrix(board, cols, rows) {
    const mat = [];
    for (let i = 0; i < rows; i++) {
        mat.push([]);
        for (let j = 0; j < cols; j++) {
            const index = i * cols + j;
            if (board[index].isRevealed) {
                mat[i].push(board[index].surroundingMines);
            } else {
                mat[i].push(-1);
            }
        }
    }
    return mat;
}






export default function Minesweeper() {
    const rows = 20;
    const cols = 30;
    const mines = 130;

    const clickKey = 'o'
    const flagKey = 'p'

    const [gameState, setGameState] = useState('playing');
    const [board, setBoard] = useState(() => createBoard(rows, cols, mines));
    const mousePosition = useMousePosition();
    
    function newGame() {
        setBoard(createBoard(rows, cols, mines));
        setGameState('playing');
        getFirstClick();
    }

    function revealAll() {
        setBoard((prevBoard) => {
            const newBoard = [...prevBoard];
            for (let i = 0; i < newBoard.length; i++) {
                newBoard[i].isRevealed = true;
            }
            return newBoard;
        });
    }

    function revealTile(index) {
        if (gameState !== 'playing') { return; }
        if (board[index].isFlagged) { return; }
        if (board[index].isMine) {
            setBoard((prevBoard) => {
                const newBoard = [...prevBoard];
                newBoard[index].exploded = true;
                return newBoard;
            });
            revealAll();
            setGameState('lose');    
            return; 
        }
        
        if (board[index].isRevealed) {
            const neighbors = getNeighbors(cols, rows, index);
            let flaggedNeighbors = 0;
            for (const neighbor of neighbors) {
                if (board[neighbor].isFlagged) { flaggedNeighbors++; }
            }
            if (flaggedNeighbors !== board[index].surroundingMines) { return; }
            for (const neighbor of neighbors) {
                if (board[neighbor].isFlagged || board[neighbor].isRevealed) { continue; }
                revealTile(neighbor);
            }
            return;
        }
        
        setBoard((prevBoard) => {
            const newBoard = [...prevBoard];
            newBoard[index].isRevealed = true;

            if (newBoard[index].surroundingMines === 0) {
                const neighbors = getNeighbors(cols, rows, index);
                for (const neighbor of neighbors) {
                    if (newBoard[neighbor].isRevealed) { continue; }
                    revealTile(neighbor);
                }
            }

            return newBoard;
        });
    }

    function flagTile(index) {
        setBoard((prevBoard) => {
            const newBoard = [...prevBoard];
            newBoard[index] = { ...newBoard[index], isFlagged: !newBoard[index].isFlagged };
            return newBoard;
        });
    }

    function getFirstClick() {
        setBoard((prevBoard) => {
            let firstClick = null;
            const newBoard = [...prevBoard];

            if (newBoard.some(tile => tile.start)) {
                return newBoard;
            }

            while (!firstClick){
                const index = Math.floor(Math.random() * rows * cols);
                if (!newBoard[index].isMine){
                    firstClick = index;
                }
            }

            newBoard[firstClick].start = true;
            return newBoard;
        });

    } 

    function solver() {
        //solveTrivial(setBoard, cols, rows);
        solveSets(setBoard, cols, rows);
    }
    
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === clickKey) {
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    clientX: mousePosition.x,
                    clientY: mousePosition.y
                });
                
                document.elementFromPoint(mousePosition.x, mousePosition.y).dispatchEvent(clickEvent);
            } else if (e.key === flagKey) {
                const flagEvent = new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    clientX: mousePosition.x,
                    clientY: mousePosition.y
                });

                document.elementFromPoint(mousePosition.x, mousePosition.y).dispatchEvent(flagEvent);
            } else if (e.key === ' ') {
                //newGame();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [mousePosition]);

    const admin = true;
    return (
        <div className='minesweeper-game'>
            <div className='minesweeper-hud'>
            
                {admin && <button onClick={() => solver()}>Solver</button>}
                <div>Remaining Mines: {mines - board.filter(tile => tile.isFlagged).length}</div>
                <button onClick={() => newGame()}>New Game</button>
                <div>{gameState === 'win' && 'You win!'}</div>
                <div>{gameState === 'lose' && 'You lose!'}</div>
            </div>
            <div className='minesweeper-board' style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 30px)` }}>
                {board.map((tile, index) => (
                    <div
                        key={index}
                        className={getTileClasses(tile)}
                        style={{
                            width: 30,
                            height: 30,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => revealTile(index)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            if (board[index].isRevealed) { return; }
                            flagTile(index);
                        }}
                    >
                        {tile.probability !== undefined ? tile.probability.toFixed(2) : ''}
                        <div className='group-display'>
                            {tile.patterns && Object.keys(tile.patterns).map((key, idx) => {
                                return <div key={idx}>{tile.patterns[key].source} {tile.patterns[key].mines}/{tile.patterns[key].range}</div>
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    
}
//{tile.isRevealed ? (tile.isMine ? '💣' : (tile.surroundingMines !== 0 && tile.surroundingMines)) : tile.isFlagged ? '🚩' : ''}