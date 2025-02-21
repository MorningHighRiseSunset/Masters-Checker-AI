var red = 1;
var redKing = 1.1;
var black = -1;
var blackKing = -1.1;
var empty = 0;
var player = red;
var computer = black;
var currentBoard = {};
var INFINITY = 10000;
var NEG_INFINITY = -10000;
var cell_width = 0;
var board_origin = 0;

function initializeBoard() {
    var initialBoard = [
        [red, empty, red, empty, red, empty, red, empty],
        [empty, red, empty, red, empty, red, empty, red],
        [red, empty, red, empty, red, empty, red, empty],
        [empty, empty, empty, empty, empty, empty, empty, empty],
        [empty, empty, empty, empty, empty, empty, empty, empty],
        [empty, black, empty, black, empty, black, empty, black],
        [black, empty, black, empty, black, empty, black, empty],
        [empty, black, empty, black, empty, black, empty, black],
    ];

    var cells = new Array();
    var pieces = new Array();
    for (var i = 0; i < initialBoard.length; i++) {
        var row = initialBoard[i];
        for (var j = 0; j < row.length; j++) {
            var colValue = row[j];
            if (colValue != empty) {
                var piece = {
                    row: i,
                    col: j,
                    state: colValue
                };
                pieces.push(piece);
            }
            var cell = {
                row: i,
                col: j,
                state: colValue
            };
            cells.push(cell);
        }
    }

    return {
        cells: cells,
        pieces: pieces,
        turn: red
    };
}

function mapCellToCoordinates(origin, width, cell) {
    var key = "" + cell.row + ":" + cell.col;
    if (!mapCellToCoordinates.answers) mapCellToCoordinates.answers = {};
    if (mapCellToCoordinates.answers[key] != null) {
        return mapCellToCoordinates.answers[key];
    }
    var x = origin.x + cell.col * width;
    var y = origin.y + cell.row * width;
    return (mapCellToCoordinates.answers[key] = {
        x: x,
        y: y
    });
}

function mapCoordinatesToCell(origin, width, cells, x, y) {
    var numSquares = 8;
    var boardLength = numSquares * width;

    if (x > origin.x + boardLength || x < origin.x) return null;
    if (y > origin.y + boardLength || y < origin.y) return null;

    var col = Math.floor((x - origin.x) / width);
    var row = Math.floor((y - origin.y) / width);
    if (col < 0 || col >= numSquares || row < 0 || row >= numSquares) return null;

    var index = row * numSquares + col;
    return cells[index];
}

function startGame(origin, cellWidth, boardCanvas) {
    movePiece.moves = [];
    d3.select("#btnReplay").style("display", "none");
    cell_width = cellWidth;
    board_origin = origin;
    currentBoard = drawBoard(origin, cellWidth, boardCanvas);
    currentBoard.ui = true;
    showBoardState();

    // Ensure the button is part of button-container
    d3.select("#printMoves") // Ensure this button exists within button-container
        .on("click", function() {
            var movesText = movePiece.moves
                .map(
                    (move, index) =>
                    `Move ${index + 1}: (${move.from.row},${move.from.col}) to (${move.to.row},${move.to.col})`,
                )
                .join("<br>");

            // Create a new window for printing
            var printWindow = window.open("", "", "height=400,width=600");
            printWindow.document.write(
                "<html><head><title>Move History</title></head><body>",
            );
            printWindow.document.write("<h1>Move History</h1>");
            printWindow.document.write(movesText);
            printWindow.document.write("</body></html>");
            printWindow.document.close();
            printWindow.print();
        });
}

function replayAll(origin, cellWidth, boardCanvas) {
    var allMoves = movePiece.moves;
    startGame(origin, cellWidth, boardCanvas);
    currentBoard.turn = 0; // can't really play
    for (var i = 0; i < allMoves.length; i++) {
        var moveNum = i + 1;
        var nextMove = allMoves[i];
        if (nextMove.to.row > -1) {
            var cellCoordinates = mapCellToCoordinates(
                board_origin,
                cell_width,
                nextMove.to,
            );
            d3.selectAll("circle").each(function(d, i) {
                if (d.col === nextMove.from.col && d.row === nextMove.from.row) {
                    d3.select(this)
                        .transition()
                        .delay(500 * moveNum)
                        .attr("cx", (d.x = cellCoordinates.x + cell_width / 2))
                        .attr("cy", (d.y = cellCoordinates.y + cell_width / 2));

                    d.col = nextMove.to.col;
                    d.row = nextMove.to.row;
                }
            });
        } else {
            d3.selectAll("circle").each(function(d, i) {
                if (d.row === nextMove.from.row && d.col === nextMove.from.col) {
                    d3.select(this)
                        .transition()
                        .delay(500 * moveNum)
                        .style("display", "none");
                    d.col = -1;
                    d.row = -1;
                }
            });
        }
    }
}

function undoMove(move, moveNum) {
    if (move.to.row > -1) {
        var cellCoordinates = mapCellToCoordinates(
            board_origin,
            cell_width,
            move.from,
        );
        d3.selectAll("circle").each(function(d, i) {
            if (d.col === move.to.col && d.row === move.to.row) {
                d3.select(this)
                    .transition()
                    .delay(500 * moveNum)
                    .attr("cx", (d.x = cellCoordinates.x + cell_width / 2))
                    .attr("cy", (d.y = cellCoordinates.y + cell_width / 2));

                d.col = move.from.col;
                d.row = move.from.row;
            }
        });
        var toIndex = getCellIndex(move.to.row, move.to.col);
        var cell = currentBoard.cells[toIndex];
        cell.state = 0;
        var fromIndex = getCellIndex(move.from.row, move.from.col);
        cell = currentBoard.cells[fromIndex];
        cell.state = move.piece.state;
        //var pieceIndex = getPieceIndex(currentBoard.pieces, move.to.row, move.to.col);
        //var piece = currentBoard.pieces[pieceIndex];
        //piece.col = move.from.col;
        //piece.row = move.from.row;
    } else {
        d3.selectAll("circle").each(function(d, i) {
            if (d.lastRow === move.from.row && d.lastCol === move.from.col) {
                d3.select(this)
                    .transition()
                    .delay(500 * moveNum)
                    .style("display", "block");
                d.col = move.from.col;
                d.row = move.from.row;

                var fromIndex = getCellIndex(move.from.row, move.from.col);
                var cell = currentBoard.cells[fromIndex];
                cell.state = move.piece.state;
                var pieceIndex = getPieceIndex(
                    currentBoard.pieces,
                    move.from.row,
                    move.from.col,
                );
                var piece = currentBoard.pieces[pieceIndex];
                piece.col = move.from.col;
                piece.row = move.from.row;
                piece.state = move.piece.state;
            }
        });
    }
}

function undo(numBack) {
    var computerUndo = 0;
    var lastTurn = player;
    var moveNum = 0;
    while (true) {
        moveNum += 1;
        var lastMove = movePiece.moves.pop();
        if (lastMove == null) {
            break;
        }
        if (lastTurn === player && lastMove.piece.state === computer) {
            computerUndo += 1;
            if (computerUndo > numBack) {
                break;
            }
        }
        if (lastMove.to.col > -1) {
            lastTurn = lastMove.piece.state;
        }
        undoMove(lastMove, moveNum);
        showBoardState();
    }
}

function movePiece(boardState, piece, fromCell, toCell, moveNum) {
    const playerOrAI = boardState.turn === player ? "Player" : "AI"; // Define at the start

    if (boardState.ui) {
        if (!movePiece.moves) {
            movePiece.moves = [];
        }
        movePiece.moves.push({
            piece: {
                col: piece.col,
                row: piece.row,
                state: piece.state
            },
            from: {
                col: fromCell.col,
                row: fromCell.row
            },
            to: {
                col: toCell.col,
                row: toCell.row
            },
        });

        // Log the initial move
        console.log(`${playerOrAI} moved from (${fromCell.row},${fromCell.col}) to (${toCell.row},${toCell.col})`);
    }

    // Get jumped piece
    const jumpedPiece = getJumpedPiece(
        boardState.cells,
        boardState.pieces,
        fromCell,
        toCell,
    );

    // Update states
    const fromIndex = getCellIndex(fromCell.row, fromCell.col);
    const toIndex = getCellIndex(toCell.row, toCell.col);
    if ((toCell.row === 0 || toCell.row === 7) && Math.abs(piece.state) === 1) {
        boardState.cells[toIndex].state = piece.state * 1.1; // Promote to King
    } else {
        boardState.cells[toIndex].state = piece.state;
    }
    boardState.cells[fromIndex].state = empty;
    if ((toCell.row === 0 || toCell.row === 7) && Math.abs(piece.state) === 1) {
        piece.state = piece.state * 1.1; // Promote to King
    }
    piece.col = toCell.col;
    piece.row = toCell.row;

    if (boardState.ui && (boardState.turn === computer || moveNum > 1)) {
        moveCircle(toCell, moveNum);
    }

    if (jumpedPiece != null) {
        const jumpedIndex = getPieceIndex(
            boardState.pieces,
            jumpedPiece.row,
            jumpedPiece.col,
        );
        const originalJumpPieceState = jumpedPiece.state;
        jumpedPiece.state = 0;

        const cellIndex = getCellIndex(jumpedPiece.row, jumpedPiece.col);
        const jumpedCell = boardState.cells[cellIndex];
        jumpedCell.state = empty;
        boardState.pieces[jumpedIndex].lastCol = boardState.pieces[jumpedIndex].col;
        boardState.pieces[jumpedIndex].lastRow = boardState.pieces[jumpedIndex].row;
        boardState.pieces[jumpedIndex].col = -1;
        boardState.pieces[jumpedIndex].row = -1;
        if (boardState.ui) {
            hideCircle(jumpedCell, moveNum);
        }

        if (boardState.ui) {
            movePiece.moves.push({
                piece: {
                    col: jumpedPiece.col,
                    row: jumpedPiece.row,
                    state: originalJumpPieceState,
                },
                from: {
                    col: jumpedCell.col,
                    row: jumpedCell.row
                },
                to: {
                    col: -1,
                    row: -1
                },
            });

            // Log the capture move
            console.log(`${playerOrAI} captured a piece at (${jumpedCell.row},${jumpedCell.col})`);
        }

        // Another jump?
        const more_moves = get_available_piece_moves(
            boardState,
            piece,
            boardState.turn,
        );
        let another_move = null;
        for (let i = 0; i < more_moves.length; i++) {
            const more_move = more_moves[i];
            if (more_move.move_type === "jump") {
                another_move = more_move;
                break;
            }
        }
        if (another_move != null) {
            moveNum += 1;
            boardState = movePiece(
                boardState,
                piece,
                another_move.from,
                another_move.to,
                moveNum,
            );
            if (boardState.ui && boardState.turn === player) {
                boardState.numPlayerMoves += moveNum;
            }
        }
    }

    return boardState;
}

function isMoveDoubleJumpVulnerable(simulatedBoard, move) {
    let boardAfterMove = copy_board(simulatedBoard);
    let pieceIndex = getPieceIndex(boardAfterMove.pieces, move.from.row, move.from.col);
    let piece = boardAfterMove.pieces[pieceIndex];
    boardAfterMove = movePiece(boardAfterMove, piece, move.from, move.to, 1);

    let opponentFirstMoveOptions = get_available_moves(player, boardAfterMove);

    for (let firstMove of opponentFirstMoveOptions) {
        if (firstMove.move_type === 'jump') {
            let boardAfterFirstJump = copy_board(boardAfterMove);
            let index = getPieceIndex(boardAfterFirstJump.pieces, firstMove.from.row, firstMove.from.col);
            let movedPiece = boardAfterFirstJump.pieces[index];
            boardAfterFirstJump = movePiece(boardAfterFirstJump, movedPiece, firstMove.from, firstMove.to, 1);

            let opponentSecondMoveOptions = get_available_moves(player, boardAfterFirstJump);
            if (jump_available(opponentSecondMoveOptions)) {
                return true;
            }
        }
    }
    return false;
}

function getCellIndex(row, col) {
    var numSquares = 8;
    var index = row * numSquares + col;
    return index;
}

function getPieceIndex(pieces, row, col) {
    var index = -1;
    for (var i = 0; i < pieces.length; i++) {
        var piece = pieces[i];
        if (piece.row === row && piece.col === col) {
            index = i;
            break;
        }
    }
    return index;
}

function getPieceCount(boardState) {
    var numRed = 0;
    var numBlack = 0;
    var pieces = boardState.pieces;
    for (var i = 0; i < pieces.length; i++) {
        var piece = pieces[i];
        if (piece.col >= 0 && piece.row >= 0) {
            if (piece.state === red || piece.state === redKing) {
                numRed += 1;
            } else if (piece.state === black || piece.state === blackKing) {
                numBlack += 1;
            }
        }
    }

    return {
        red: numRed,
        black: numBlack
    };
}

function getScore(boardState) {
    var pieceCount = getPieceCount(boardState);
    var score = pieceCount.red - pieceCount.black;
    return score;
}

function getWinner(boardState) {
    var pieceCount = getPieceCount(boardState);
    
    // Check for no pieces left
    if (pieceCount.red > 0 && pieceCount.black === 0) {
        return red;
    } else if (pieceCount.black > 0 && pieceCount.red === 0) {
        return black;
    }
    
    // Check for no valid moves (draw)
    let redMoves = get_available_moves(red, boardState);
    let blackMoves = get_available_moves(black, boardState);
    
    if (redMoves.length === 0 && blackMoves.length === 0) {
        return "draw";
    }
    
    return 0;
}

/* SIDE EFFECT FUNCTIONS: UI and Board State */
function dragStarted(d) {
    d3.select(this).classed("dragging", true);
}

function dragged(d) {
    if (currentBoard.gameOver) return;
    if (currentBoard.turn != red && currentBoard.turn != redKing) return;
    if (currentBoard.turn != player) return;
    var c = d3.select(this);
    d3.select(this)
        .attr("cx", (d.x = d3.event.x))
        .attr("cy", (d.y = d3.event.y));
}

function moveCircle(cell, moveNum) {
    var cellCoordinates = mapCellToCoordinates(board_origin, cell_width, cell);
    currentBoard.delay = moveNum * 500 + 500;
    d3.selectAll("circle").each(function(d, i) {
        if (d.col === cell.col && d.row === cell.row) {
            d3.select(this)
                .transition()
                .delay(500 * moveNum)
                .attr("cx", (d.x = cellCoordinates.x + cell_width / 2))
                .attr("cy", (d.y = cellCoordinates.y + cell_width / 2));
        }
    });
}

function hideCircle(cell, moveNum) {
    currentBoard.delay = moveNum * 600 + 500;
    d3.selectAll("circle").each(function(d, i) {
        if (d.state === 0 && d.lastRow === cell.row && d.lastCol === cell.col) {
            // Remove or comment out the debug log statement
            // console.log("Hide col=" + cell.col + ", row=" + cell.row);
            d3.select(this)
                .transition()
                .delay(600 * moveNum)
                .style("display", "none");
        }
    });
}

function dragEnded(origin, width, node, d) {
    if (currentBoard.turn != red && currentBoard.turn != redKing) return;
    if (currentBoard.turn != player) return;

    var cell = mapCoordinatesToCell(origin, width, currentBoard.cells, d.x, d.y);
    var from = d;
    var to = cell;

    // Check if any jumps are available
    var available_moves = get_available_moves(player, currentBoard);
    var hasJumps = jump_available(available_moves);

    // If jumps are available, only allow jump moves
    if (hasJumps) {
        var isJumpMove = false;
        for (var i = 0; i < available_moves.length; i++) {
            var move = available_moves[i];
            if (
                move.move_type === "jump" &&
                move.from.row === from.row &&
                move.from.col === from.col &&
                move.to.row === to.row &&
                move.to.col === to.col
            ) {
                isJumpMove = true;
                break;
            }
        }

        if (!isJumpMove) {
            // Return piece to original position if not making a required jump
            var index = getCellIndex(d.row, d.col);
            var originalCell = currentBoard.cells[index];
            var cellCoordinates = mapCellToCoordinates(origin, width, originalCell);
            node
                .attr("cx", (d.x = cellCoordinates.x + width / 2))
                .attr("cy", (d.y = cellCoordinates.y + width / 2));
            return;
        }
    }

    var legal = isMoveLegal(currentBoard.cells, currentBoard.pieces, d, from, to);
    var index = getCellIndex(d.row, d.col);
    var originalCell = currentBoard.cells[index];

    if (!legal) {
        var cellCoordinates = mapCellToCoordinates(origin, width, originalCell);
        node
            .attr("cx", (d.x = cellCoordinates.x + width / 2))
            .attr("cy", (d.y = cellCoordinates.y + width / 2));
    } else {
        // Rest of the existing dragEnded function...
        currentBoard = movePiece(currentBoard, d, originalCell, cell, 1);

        var cellCoordinates = mapCellToCoordinates(origin, width, cell);
        node
            .attr("cx", (d.x = cellCoordinates.x + width / 2))
            .attr("cy", (d.y = cellCoordinates.y + width / 2));

        var score = getScore(currentBoard);
        showBoardState();

        currentBoard.turn = computer;

        var delayCallback = function() {
            var winner = getWinner(currentBoard);
            if (winner !== 0) {
                currentBoard.gameOver = true;
                updateScoreboard();
            } else {
                computerMove();
            }
            return true;
        };

        var moveDelay = currentBoard.delay;
        setTimeout(delayCallback, moveDelay);
    }
}
/* END SIDE EFFECT FUNCTIONS */

function getJumpedPiece(cells, pieces, from, to) {
    var distance = {
        x: to.col - from.col,
        y: to.row - from.row
    };
    if (abs(distance.x) == 2) {
        var jumpRow = from.row + sign(distance.y);
        var jumpCol = from.col + sign(distance.x);
        var index = getPieceIndex(pieces, jumpRow, jumpCol);
        var jumpedPiece = pieces[index];
        return jumpedPiece;
    } else return null;
}

function isMoveLegal(cells, pieces, piece, from, to) {
    if (to.col < 0 || to.row < 0 || to.col > 7 || to.row > 7) {
        // Move is off the board
        return false;
    }
    var distance = {
        x: to.col - from.col,
        y: to.row - from.row
    };
    if (distance.x === 0 || distance.y === 0) {
        // Can't move horizontally or vertically
        return false;
    }
    if (Math.abs(distance.x) !== Math.abs(distance.y)) {
        // Move must be diagonal
        return false;
    }
    if (Math.abs(distance.x) > 2) {
        // Can't move more than two squares diagonally
        return false;
    }
    if (to.state !== empty) {
        // Target cell isn't empty
        return false;
    }
    if (Math.abs(distance.x) === 2) {
        var jumpedPiece = getJumpedPiece(cells, pieces, from, to);
        if (!jumpedPiece) {
            // No piece to jump
            return false;
        }
        if (Math.round(piece.state) !== -Math.round(jumpedPiece.state)) {
            // Can't jump own piece
            return false;
        }
    }
    if (Math.round(piece.state) === piece.state && Math.sign(piece.state) !== Math.sign(distance.y)) {
        // Wrong move direction for non-king piece
        return false;
    }

    return true;
}

function drawBoard(origin, cellWidth, boardCanvas) {
    var boardState = initializeBoard();
    var cells = boardState.cells;
    var pieces = boardState.pieces;

    // Increase the size of the boardCanvas
    var boardSize = cellWidth * 8;
    boardCanvas
        .attr("width", boardSize)
        .attr("height", boardSize)
        .attr("class", "checker-board");

    // Define gradients for pieces
    var defs = boardCanvas.append("defs");

    var redGradient = defs
        .append("radialGradient")
        .attr("id", "redGradient")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%")
        .attr("fx", "50%")
        .attr("fy", "50%");
    redGradient
        .append("stop")
        .attr("offset", "0%")
        .attr("style", "stop-color:#696969;stop-opacity:1");
    redGradient
        .append("stop")
        .attr("offset", "100%")
        .attr("style", "stop-color:#000000;stop-opacity:1");

    var blackGradient = defs
        .append("radialGradient")
        .attr("id", "blackGradient")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%")
        .attr("fx", "50%")
        .attr("fy", "50%");
    blackGradient
        .append("stop")
        .attr("offset", "0%")
        .attr("style", "stop-color:#FF6347;stop-opacity:1");
    blackGradient
        .append("stop")
        .attr("offset", "100%")
        .attr("style", "stop-color:#B22222;stop-opacity:1");

    // Define drop shadow filter
    var filter = defs
        .append("filter")
        .attr("id", "dropShadow")
        .attr("height", "150%");
    filter
        .append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 2);
    filter
        .append("feOffset")
        .attr("dx", 1)
        .attr("dy", 1)
        .attr("result", "offsetblur");
    filter.append("feMerge")
        .append("feMergeNode")
        .attr("in", "offsetblur");
    filter.append("feMerge")
        .append("feMergeNode")
        .attr("in", "SourceGraphic");

    // Draw cells
    boardCanvas
        .append("g")
        .selectAll("rect")
        .data(cells)
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return mapCellToCoordinates(origin, cellWidth, d).x;
        })
        .attr("y", function(d) {
            return mapCellToCoordinates(origin, cellWidth, d).y;
        })
        .attr("height", cellWidth)
        .attr("width", cellWidth)
        .style("fill", function(d) {
            return (d.row + d.col) % 2 === 0 ? "#FFFFFF" : "#000000";
        });

    // Set up drag behavior
    var dragBehavior = d3.drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", function(d) {
            dragEnded(origin, cellWidth, d3.select(this), d);
        });

    // Draw pieces and add click event for position display
    boardCanvas
        .append("g")
        .selectAll("circle")
        .data(pieces)
        .enter()
        .append("circle")
        .attr("r", cellWidth / 2.5)
        .attr("cx", function(d) {
            var x = mapCellToCoordinates(origin, cellWidth, d).x;
            return x + cellWidth / 2;
        })
        .attr("cy", function(d) {
            var y = mapCellToCoordinates(origin, cellWidth, d).y;
            return y + cellWidth / 2;
        })
        .style("fill", function(d) {
            return d.state == red || d.state == redKing ? "url(#redGradient)" : "url(#blackGradient)";
        })
        .style("filter", "url(#dropShadow)")
        .call(dragBehavior)
        .on("click", function(d) {
            // Determine piece color
            let pieceColor = (d.state == red || d.state == redKing) ? "Red" : "Black";
            // Display position in the console
            console.log(`${pieceColor} Checker at Position: (${d.row}, ${d.col})`);

            // Optionally, display this info in a DOM element
            // d3.select("#positionDisplay").html(`${pieceColor} Checker at Position: (${d.row}, ${d.col})`);
        });

    return boardState;
}

function updateScoreboard() {
    var pieceCount = getPieceCount(currentBoard);

    // Update piece counts
    var redLabel = "Black: " + pieceCount.red;
    var blackLabel = "Red: " + pieceCount.black;

    d3.select("#redScore").html(redLabel);
    d3.select("#blackScore").html(blackLabel);

    var winner = getWinner(currentBoard);
    var winnerLabel = "";
    
    if (winner === player) {
        winnerLabel = "Black Wins!!";
    } else if (winner === computer) {
        winnerLabel = "Red Wins!!";
    } else if (winner === "draw") {
        winnerLabel = "Game Draw - No More Valid Moves!";
    }

    if (winner !== 0) {
        d3.select("#btnReplay").style("display", "inline");
        
        // Add visual feedback for draw
        if (winner === "draw") {
            d3.select("#winner")
                .html(winnerLabel)
                .style("color", "#FFD700"); // Gold color for draw
        } else {
            d3.select("#winner")
                .html(winnerLabel)
                .style("color", "#fff"); // Reset color for wins
        }
    }

    d3.select("#winner").html(winnerLabel);
}

function integ(num) {
    if (num != null) return Math.round(num);
    else return null;
}

function abs(num) {
    return Math.abs(num);
}

function sign(num) {
    if (num < 0) return -1;
    else return 1;
}

function drawText(data) {
    boardCanvas
        .append("g")
        .selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("x", function(d) {
            var x = mapCellToCoordinates(board_origin, cell_width, d).x;
            return x + cell_width / 2;
        })
        .attr("y", function(d) {
            var y = mapCellToCoordinates(board_origin, cell_width, d).y;
            return y + cell_width / 2;
        })
        .style("fill", function(d) {
            if (d.state === red) return "black";
            else return "white";
        })
        .text(function(d) {
            /*if (d.state === red) return "R"; 
									else if (d.state === black) return "B"; 
									else*/
            if (d.state === redKing || d.state === blackKing) return "K";
            else return "";
        });
}

function showBoardState() {
    d3.selectAll("text").each(function(d, i) {
        d3.select(this).style("display", "none");
    });

    var cells = currentBoard.cells;
    var pieces = currentBoard.pieces;
    //drawText(cells);
    drawText(pieces);
}

/* COMPUTER AI FUNCTIONS */
function copy_board(board) {
    var newBoard = {};
    newBoard.ui = false;
    var cells = new Array();
    var pieces = new Array();

    for (var i = 0; i < board.cells.length; i++) {
        var cell = board.cells[i];
        var newCell = {
            row: cell.row,
            col: cell.col,
            state: cell.state
        };
        cells.push(newCell);
    }
    for (var i = 0; i < board.pieces.length; i++) {
        var piece = board.pieces[i];
        var newPiece = {
            row: piece.row,
            col: piece.col,
            state: piece.state
        };
        pieces.push(newPiece);
    }

    return {
        cells: cells,
        pieces: pieces,
        turn: board.turn
    };
}

function get_player_pieces(player, target_board) {
    player_pieces = new Array();
    for (var i = 0; i < target_board.pieces.length; i++) {
        var piece = target_board.pieces[i];
        if (
            piece.state === player ||
            piece.state === player + 0.1 ||
            piece.state === player - 0.1
        ) {
            player_pieces.push(piece);
        }
    }
    return player_pieces;
}

function get_cell_index(target_board, col, row) {
    var index = -1;
    for (var i = 0; i < target_board.cells.length; i++) {
        var cell = target_board.cells[i];
        if (cell.col === col && cell.row === row) {
            index = i;
            break;
        }
    }
    return index;
}

function get_available_piece_moves(target_board, target_piece, player) {
    var moves = [];
    var from = target_piece;

    // check for slides
    var x = [-1, 1];
    x.forEach(function(entry) {
        var cell_index = get_cell_index(
            target_board,
            from.col + entry,
            from.row + player * 1,
        );
        if (cell_index >= 0) {
            var to = target_board.cells[cell_index];
            if (
                isMoveLegal(target_board.cells, target_board.pieces, from, from, to)
            ) {
                move = {
                    move_type: "slide",
                    piece: player,
                    from: {
                        col: from.col,
                        row: from.row
                    },
                    to: {
                        col: to.col,
                        row: to.row
                    },
                };
                moves[moves.length] = move;
            }
        }
    });

    // check for jumps
    x = [-2, 2];
    x.forEach(function(entry) {
        var cell_index = get_cell_index(
            target_board,
            from.col + entry,
            from.row + player * 2,
        );
        if (cell_index >= 0) {
            var to = target_board.cells[cell_index];
            if (
                isMoveLegal(target_board.cells, target_board.pieces, from, from, to)
            ) {
                move = {
                    move_type: "jump",
                    piece: player,
                    from: {
                        col: from.col,
                        row: from.row
                    },
                    to: {
                        col: to.col,
                        row: to.row
                    },
                };
                moves[moves.length] = move;
            }
        }
    });

    // kings
    if (Math.abs(from.state) === 1.1) {
        // check for slides
        var x = [-1, 1];
        var y = [-1, 1];
        x.forEach(function(xmove) {
            y.forEach(function(ymove) {
                var cell_index = get_cell_index(
                    target_board,
                    from.col + xmove,
                    from.row + ymove,
                );
                if (cell_index >= 0) {
                    var to = target_board.cells[cell_index];
                    if (
                        isMoveLegal(target_board.cells, target_board.pieces, from, from, to)
                    ) {
                        move = {
                            move_type: "slide",
                            piece: player,
                            from: {
                                col: from.col,
                                row: from.row
                            },
                            to: {
                                col: to.col,
                                row: to.row
                            },
                        };
                        moves[moves.length] = move;
                    }
                }
            });
        });

        // check for jumps
        x = [-2, 2];
        y = [-2, 2];
        x.forEach(function(xmove) {
            y.forEach(function(ymove) {
                var cell_index = get_cell_index(
                    target_board,
                    from.col + xmove,
                    from.row + ymove,
                );
                if (cell_index >= 0) {
                    var to = target_board.cells[cell_index];
                    if (
                        isMoveLegal(target_board.cells, target_board.pieces, from, from, to)
                    ) {
                        move = {
                            move_type: "jump",
                            piece: player,
                            from: {
                                col: from.col,
                                row: from.row
                            },
                            to: {
                                col: to.col,
                                row: to.row
                            },
                        };
                        moves[moves.length] = move;
                    }
                }
            });
        });
    }

    return moves;
}

function get_available_moves(player, target_board) {
    var moves = [];
    var move = null;
    var player_pieces = get_player_pieces(player, target_board);

    // Get all possible moves
    for (var i = 0; i < player_pieces.length; i++) {
        var from = player_pieces[i];
        var piece_moves = get_available_piece_moves(target_board, from, player);
        moves.push.apply(moves, piece_moves);
    }

    // Force jumps - if any jump moves exist, only return those
    var jump_moves = [];
    for (var i = 0; i < moves.length; i++) {
        var move = moves[i];
        if (move.move_type == "jump") {
            jump_moves.push(move);
        }
    }
    if (jump_moves.length > 0) {
        moves = jump_moves; // Only return jump moves if they exist
    }

    return moves;
}

function select_random_move(moves) {
    // Randomly select move
    var index = Math.floor(Math.random() * (moves.length - 1));
    var selected_move = moves[index];

    return selected_move;
}

function isMoveVulnerable(simulatedBoard, move) {
    // Simulate the current move
    let boardAfterMove = copy_board(simulatedBoard);
    let pieceIndex = getPieceIndex(boardAfterMove.pieces, move.from.row, move.from.col);
    let piece = boardAfterMove.pieces[pieceIndex];
    boardAfterMove = movePiece(boardAfterMove, piece, move.from, move.to, 1);

    // Get opponent's available moves and check if any can capture the piece
    let opponentMoves = get_available_moves(player, boardAfterMove);
    return opponentMoves.some(opMove => 
        opMove.move_type === "jump" && opMove.to.row === move.to.row && opMove.to.col === move.to.col
    );
}

function isSacrificeForDoubleJump(simulatedBoard, move) {
    // Simulate the current move
    let boardAfterMove = copy_board(simulatedBoard);
    let pieceIndex = getPieceIndex(boardAfterMove.pieces, move.from.row, move.from.col);
    let piece = boardAfterMove.pieces[pieceIndex];
    boardAfterMove = movePiece(boardAfterMove, piece, move.from, move.to, 1);

    // Get opponent's available moves assuming they make the best single jump
    let opponentMoves = get_available_moves(player, boardAfterMove);
    let doubleJumpExists = false;

    opponentMoves.forEach(opponentMove => {
        if (opponentMove.move_type === 'jump') {
            // Apply jump move
            let boardAfterJump = copy_board(boardAfterMove);
            let index = getPieceIndex(boardAfterJump.pieces, opponentMove.from.row, opponentMove.from.col);
            let opponentPiece = boardAfterJump.pieces[index];
            boardAfterJump = movePiece(boardAfterJump, opponentPiece, opponentMove.from, opponentMove.to, 1);

            // Check for subsequent double jump opportunity
            let subsequentMoves = get_available_moves(player, boardAfterJump);
            if (subsequentMoves.some(nextMove => nextMove.move_type === 'jump')) {
                doubleJumpExists = true;
            }
        }
    });

    // Only return true if we setup a double jump scenario for us
    return !doubleJumpExists;
}

function isMoveSafe(simulatedBoard, move) {
    let boardAfterMove = copy_board(simulatedBoard);
    let pieceIndex = getPieceIndex(boardAfterMove.pieces, move.from.row, move.from.col);
    let piece = boardAfterMove.pieces[pieceIndex];
    boardAfterMove = movePiece(boardAfterMove, piece, move.from, move.to, 1);

    // Look at all opponent's moves after this move
    let opponentMoves = get_available_moves(player, boardAfterMove);

    // Ensure that the move does not make the AI's piece capturable
    return !opponentMoves.some(opMove =>
        opMove.move_type === 'jump' &&
        (opMove.to.row === move.to.row && opMove.to.col === move.to.col)
    );
}

function computerMove() {
    var simulated_board = copy_board(currentBoard);
    var available_moves = get_available_moves(computer, simulated_board);

    if (available_moves.length === 0) {
        // Check if it's a draw
        let player_moves = get_available_moves(player, simulated_board);
        if (player_moves.length === 0) {
            currentBoard.gameOver = true;
            updateScoreboard();
        }
        return;
    }

    // Prioritize jump moves or filter for safe moves otherwise
    var jump_moves = available_moves.filter(move => move.move_type === 'jump');
    
    if (jump_moves.length > 0) {
        move_to_execute = alpha_beta_search(simulated_board, 10, jump_moves) || select_random_move(jump_moves);
    } else {
        available_moves = filterSafeMoves(available_moves, simulated_board);
        move_to_execute = alpha_beta_search(simulated_board, 10, available_moves) || select_random_move(available_moves);
    }

    executeMove(move_to_execute);
}

function executeMove(move) {
    if (!move) {
        console.error('No valid move selected.');
        return;
    }

    const pieceIndex = getPieceIndex(currentBoard.pieces, move.from.row, move.from.col);
    if (pieceIndex !== -1) {
        const piece = currentBoard.pieces[pieceIndex];
        currentBoard = movePiece(currentBoard, piece, move.from, move.to, 1);
        moveCircle(move.to, 1);
        showBoardState();
        
        // Check for game over
        const winner = getWinner(currentBoard);
        if (winner !== 0) {
            currentBoard.gameOver = true;
        } else {
            currentBoard.turn = player;
            currentBoard.delay = 0;
        }

    } else {
        console.error('Invalid piece index for the selected move.');
    }
}

function filterSafeMoves(moves, board) {
    let safeMoves = moves.filter(move => {
        let simulated_board = copy_board(board);
        let pieceIndex = getPieceIndex(simulated_board.pieces, move.from.row, move.from.col);
        let piece = simulated_board.pieces[pieceIndex];

        simulated_board = movePiece(simulated_board, piece, move.from, move.to, 1);
        let opponentMoves = get_available_moves(player, simulated_board);

        return !opponentMoves.some(opMove => 
            opMove.move_type === 'jump' || 
            createsDoubleJump(simulated_board, opMove)
        );
    });

    // If no moves are marked safe, permit slightly risky moves to ensure a move is made
    if (safeMoves.length === 0) {
        safeMoves = moves.filter(move => {
            let simulated_board = copy_board(board);
            let pieceIndex = getPieceIndex(simulated_board.pieces, move.from.row, move.from.col);
            let piece = simulated_board.pieces[pieceIndex];
    
            simulated_board = movePiece(simulated_board, piece, move.from, move.to, 1);
            let opponentMoves = get_available_moves(player, simulated_board);

            // Consider moves with minimal risk (i.e., no immediate loss but potential double jumps may exist)
            return !opponentMoves.some(opMove => opMove.move_type === 'jump');
        });
    }

    return safeMoves;
}

function createsDoubleJump(board, move) {
    let simulatedBoard = copy_board(board);
    let pieceIndex = getPieceIndex(simulatedBoard.pieces, move.from.row, move.from.col);
    let piece = simulatedBoard.pieces[pieceIndex];
    simulatedBoard = movePiece(simulatedBoard, piece, move.from, move.to, 1);

    let nextAvailableMoves = get_available_moves(player, simulatedBoard);
    return nextAvailableMoves.some(nextMove => nextMove.move_type === 'jump');
}

function jump_available(available_moves) {
    var jump = false;
    for (var i = 0; i < available_moves.length; i++) {
        var move = available_moves[i];
        if (move.move_type == "jump") {
            jump = true;
            break;
        }
    }

    return jump;
}

function alpha_beta_search(calc_board, limit, moves) {
    let alpha = NEG_INFINITY;
    let beta = INFINITY;
    let best_move;
    let max_score = NEG_INFINITY;

    // Sort moves to improve pruning efficiency
    moves.sort((a, b) => {
        // Prioritize jumps and king moves
        if (a.move_type === 'jump' && b.move_type !== 'jump') return -1;
        if (b.move_type === 'jump' && a.move_type !== 'jump') return 1;
        return Math.abs(a.piece.state) === 1.1 ? -1 : 1;
    });

    for (let move of moves) {
        let simulated_board = copy_board(calc_board);
        let pieceIndex = getPieceIndex(simulated_board.pieces, move.from.row, move.from.col);
        let piece = simulated_board.pieces[pieceIndex];
        simulated_board = movePiece(simulated_board, piece, move.from, move.to, 1);

        let score = min_value(simulated_board, get_available_moves(player, simulated_board), limit - 1, alpha, beta);

        if (score > max_score) {
            max_score = score;
            best_move = move;
        }
        alpha = Math.max(alpha, score);
        if (alpha >= beta) break; // Beta cutoff
    }

    return best_move;
}

function evaluate_position(x, y, isKing) {
    // Prioritize edges and back row for regular pieces
    let positionScore = 0;
    
    // Edge control bonus
    if (x === 0 || x === 7) positionScore += 3;
    
    // Back row protection bonus
    if (y === 0 || y === 7) positionScore += 4;
    
    // Center control bonus (more important for kings)
    if ((x === 3 || x === 4) && (y === 3 || y === 4)) {
        positionScore += isKing ? 4 : 2;
    }
    
    // Diagonal control bonus
    if ((x + y) % 2 === 0) positionScore += 1;
    
    return positionScore;
}

function min_value(calc_board, human_moves, limit, alpha, beta) {
    if (limit <= 0 || human_moves.length === 0) {
        return utility(calc_board);
    }
    let min = INFINITY;

    for (let move of human_moves) {
        let simulated_board = copy_board(calc_board);
        let pieceIndex = getPieceIndex(simulated_board.pieces, move.from.row, move.from.col);
        let piece = simulated_board.pieces[pieceIndex];
        simulated_board = movePiece(simulated_board, piece, move.from, move.to, 1);

        let computer_moves = get_available_moves(computer, simulated_board);
        let score = max_value(simulated_board, computer_moves, limit - 1, alpha, beta);

        min = Math.min(min, score);
        if (min <= alpha) return min;
        beta = Math.min(beta, min);
    }

    return min;
}

function max_value(calc_board, computer_moves, limit, alpha, beta) {
    if (limit <= 0 || computer_moves.length === 0) {
        return utility(calc_board);
    }
    let max = NEG_INFINITY;

    for (let move of computer_moves) {
        let simulated_board = copy_board(calc_board);
        let pieceIndex = getPieceIndex(simulated_board.pieces, move.from.row, move.from.col);
        let piece = simulated_board.pieces[pieceIndex];
        simulated_board = movePiece(simulated_board, piece, move.from, move.to, 1);

        let human_moves = get_available_moves(player, simulated_board);
        let score = min_value(simulated_board, human_moves, limit - 1, alpha, beta);

        max = Math.max(max, score);
        if (max >= beta) return max;
        alpha = Math.max(alpha, max);
    }

    return max;
}

function evaluate_position(x, y) {
    if (x == 0 || x == 7 || y == 0 || y == 7) {
        return 5;
    } else {
        return 3;
    }
}

function utility(target_board) {
    let computer_pieces = 0;
    let computer_kings = 0;
    let human_pieces = 0;
    let human_kings = 0;
    let computer_pos_sum = 0;
    let human_pos_sum = 0;
    let potential_captures = 0;
    let mobility_score = 0;

    // Calculate piece counts and positions
    for (var piece of target_board.pieces) {
        if (piece.row > -1) {
            let isKing = Math.abs(piece.state) === 1.1;
            if (piece.state > 0) {
                human_pieces += 1;
                if (isKing) human_kings += 1;
                human_pos_sum += evaluate_position(piece.col, piece.row, isKing);
            } else {
                computer_pieces += 1;
                if (isKing) computer_kings += 1;
                computer_pos_sum += evaluate_position(piece.col, piece.row, isKing);
            }
        }
    }

    // Calculate mobility (number of available moves)
    let computer_moves = get_available_moves(computer, target_board).length;
    let human_moves = get_available_moves(player, target_board).length;
    mobility_score = computer_moves - human_moves;

    // Calculate feature weights
    let piece_weight = 100;
    let king_weight = 130;
    let position_weight = 10;
    let mobility_weight = 15;
    let endgame = (computer_pieces + human_pieces) < 10;

    if (endgame) {
        piece_weight *= 1.5;
        king_weight *= 2;
        mobility_weight *= 2;
    }

    // Calculate final score
    let score = 
        piece_weight * (computer_pieces - human_pieces) +
        king_weight * (computer_kings - human_kings) +
        position_weight * (computer_pos_sum - human_pos_sum) +
        mobility_weight * mobility_score;

    return score;
}

function analyzeMovePattern(move, board) {
    let pattern_score = 0;
    
    // Check if move creates a protected piece
    if (isProtectedPosition(move.to, board)) {
        pattern_score += 50;
    }
    
    // Check if move blocks opponent's king path
    if (blocksKingPath(move, board)) {
        pattern_score += 40;
    }
    
    // Check if move creates a double-jump threat
    if (createsDoubleJumpThreat(move, board)) {
        pattern_score += 60;
    }
    
    return pattern_score;
}

function isProtectedPosition(pos, board) {
    return pos.row === 0 || pos.col === 0 || pos.col === 7 ||
           hasAdjacentFriendlyPiece(pos, board);
}

function hasAdjacentFriendlyPiece(pos, board) {
    let adjacent = [
        {row: pos.row-1, col: pos.col-1},
        {row: pos.row-1, col: pos.col+1},
        {row: pos.row+1, col: pos.col-1},
        {row: pos.row+1, col: pos.col+1}
    ];
    
    return adjacent.some(adj => {
        if (adj.row < 0 || adj.row > 7 || adj.col < 0 || adj.col > 7) return false;
        let piece = board.pieces.find(p => p.row === adj.row && p.col === adj.col);
        return piece && Math.sign(piece.state) === Math.sign(computer);
    });
}
