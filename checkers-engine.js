let isMobile = window.matchMedia("(pointer: coarse)").matches;
let selectedPiece = null;
let highlightedCells = [];

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
let forceJump = false; // Track if player must continue jumping
let forceJumpPiece = null; // Track which piece must continue jumping

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

    var cells = [];
    var pieces = [];
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

function getCellIndex(row, col) {
    return row * 8 + col;
}

function getPieceIndex(pieces, row, col) {
    for (var i = 0; i < pieces.length; i++) {
        var piece = pieces[i];
        if (piece.row === row && piece.col === col) {
            return i;
        }
    }
    return -1;
}

function abs(num) {
    return Math.abs(num);
}

function sign(num) {
    if (num < 0) return -1;
    else return 1;
}

function drawBoard(origin, cellWidth, boardCanvas) {
    var cells = currentBoard.cells;
    var pieces = currentBoard.pieces;

    var boardSize = cellWidth * 8;
    boardCanvas
        .attr("width", boardSize)
        .attr("height", boardSize)
        .attr("class", "checker-board");

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
        })
        .on("click", function(d) {
            mobileCellTapHandler(d);
        });

    // Draw pieces
    boardCanvas
        .append("g")
        .selectAll("circle")
        .data(pieces.filter(p => p.row >= 0 && p.col >= 0))
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
        .attr("class", function(d) {
            return (selectedPiece && d.row === selectedPiece.row && d.col === selectedPiece.col) ? "selected-piece" : "";
        })
        .style("fill", function(d) {
            return d.state == red || d.state == redKing ? "url(#redGradient)" : "url(#blackGradient)";
        })
        .on("click", function(d) {
            if (Math.sign(d.state) === Math.sign(player)) mobilePieceTapHandler(d);
        });

    // Overlay ♛ symbol for kings
    boardCanvas
        .append("g")
        .selectAll("text")
        .data(pieces.filter(p => Math.abs(p.state) === 1.1 && p.row >= 0 && p.col >= 0))
        .enter()
        .append("text")
        .attr("x", function(d) {
            var x = mapCellToCoordinates(origin, cellWidth, d).x;
            return x + cellWidth / 2;
        })
        .attr("y", function(d) {
            var y = mapCellToCoordinates(origin, cellWidth, d).y;
            return y + cellWidth / 2 + cellWidth / 7; // adjust vertical alignment
        })
        .attr("text-anchor", "middle")
        .attr("font-size", cellWidth / 1.8)
        .attr("pointer-events", "none")
        .attr("fill", "#FFD700")
        .text("♛");
}

function startGame(origin, cellWidth, boardCanvas) {
    movePiece.moves = [];
    d3.select("#btnReplay").style("display", "none");
    cell_width = cellWidth;
    board_origin = origin;
    currentBoard = initializeBoard();
    currentBoard.ui = true;
    selectedPiece = null;
    forceJump = false;
    forceJumpPiece = null;
    showBoardState();
}

// --- Move and Game Logic ---

function getJumpedPiece(cells, pieces, from, to) {
    if (abs(to.col - from.col) === 2) {
        var jumpRow = from.row + sign(to.row - from.row);
        var jumpCol = from.col + sign(to.col - from.col);
        let idx = getPieceIndex(pieces, jumpRow, jumpCol);
        if (idx !== -1) return pieces[idx];
    }
    return null;
}

function isMoveLegal(cells, pieces, piece, from, to) {
    if (!to || to.col < 0 || to.row < 0 || to.col > 7 || to.row > 7) return false;
    if (to.state !== empty) return false;
    var dx = to.col - from.col, dy = to.row - from.row;
    if (dx === 0 || dy === 0 || abs(dx) !== abs(dy) || abs(dx) > 2) return false;
    if (abs(dx) === 2) {
        var jumped = getJumpedPiece(cells, pieces, from, to);
        if (!jumped || Math.round(piece.state) !== -Math.round(jumped.state)) return false;
    }
    if (Math.round(piece.state) === piece.state && sign(piece.state) !== sign(dy)) return false;
    return true;
}

function get_available_piece_moves(board, piece, player) {
    var moves = [], dirs = [-1, 1];
    // For regular pieces, only move in the correct direction
    if (abs(piece.state) === 1) {
        dirs = [sign(piece.state)];
    }
    // Slides
    dirs.forEach(function(dy) {
        [-1, 1].forEach(function(dx) {
            var row = piece.row + dy, col = piece.col + dx;
            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                var to = board.cells[getCellIndex(row, col)];
                if (isMoveLegal(board.cells, board.pieces, piece, piece, to))
                    moves.push({move_type: "slide", from: {...piece}, to: {row, col}});
            }
        });
    });
    // Jumps
    dirs.forEach(function(dy) {
        [-1, 1].forEach(function(dx) {
            var row = piece.row + dy * 2, col = piece.col + dx * 2;
            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                var to = board.cells[getCellIndex(row, col)];
                if (isMoveLegal(board.cells, board.pieces, piece, piece, to))
                    moves.push({move_type: "jump", from: {...piece}, to: {row, col}});
            }
        });
    });
    return moves;
}

function get_available_moves(player, board) {
    var moves = [];
    board.pieces.filter(function(p) { return Math.sign(p.state) === Math.sign(player) && p.row >= 0 && p.col >= 0; })
        .forEach(function(piece) {
            moves = moves.concat(get_available_piece_moves(board, piece, player));
        });
    var jumps = moves.filter(function(m) { return m.move_type === "jump"; });
    return jumps.length ? jumps : moves;
}

function movePiece(board, piece, from, to, moveNum, recordMove = true) {
    if (moveNum === undefined) moveNum = 1;
    var newBoard = copy_board(board);
    var fromIdx = getCellIndex(from.row, from.col), toIdx = getCellIndex(to.row, to.col);
    var pIdx = getPieceIndex(newBoard.pieces, from.row, from.col);
    if (pIdx === -1) return newBoard;
    var p = newBoard.pieces[pIdx];
    // Move piece
    newBoard.cells[fromIdx].state = empty;
    newBoard.cells[toIdx].state = p.state;
    p.row = to.row; p.col = to.col;
    // King promotion
    if ((to.row === 0 || to.row === 7) && abs(p.state) === 1) {
        p.state = p.state * 1.1;
        newBoard.cells[toIdx].state = p.state;
    }
    // Remove jumped piece
    var jumped = getJumpedPiece(newBoard.cells, newBoard.pieces, from, to);
    if (jumped) {
        var jIdx = getPieceIndex(newBoard.pieces, jumped.row, jumped.col);
        if (jIdx !== -1) {
            newBoard.cells[getCellIndex(jumped.row, jumped.col)].state = empty;
            newBoard.pieces[jIdx].row = -1; newBoard.pieces[jIdx].col = -1; newBoard.pieces[jIdx].state = 0;
        }
        // Multi-jump
        var moreJumps = get_available_piece_moves(newBoard, p, board.turn).filter(function(m) { return m.move_type === "jump"; });
        if (moreJumps.length) {
            if (recordMove) {
                if (!movePiece.moves) movePiece.moves = [];
                movePiece.moves.push({from: {...from}, to: {...to}, move_type: "jump"});
            }
            return movePiece(newBoard, p, moreJumps[0].from, moreJumps[0].to, moveNum + 1, recordMove);
        }
    }
    if (recordMove) {
        if (!movePiece.moves) movePiece.moves = [];
        movePiece.moves.push({from: {...from}, to: {...to}, move_type: jumped ? "jump" : "slide"});
    }
    return newBoard;
}

function copy_board(board) {
    return {
        cells: board.cells.map(function(c) { return {...c}; }),
        pieces: board.pieces.map(function(p) { return {...p}; }),
        turn: board.turn,
        ui: board.ui,
        gameOver: board.gameOver
    };
}

// --- AI (Minimax with Alpha-Beta) ---

function utility(board) {
    let score = 0;
    for (let p of board.pieces) {
        if (p.row < 0) continue;
        let val = (abs(p.state) === 1.1 ? 3 : 1);
        score += Math.sign(p.state) === Math.sign(computer) ? val : -val;
    }
    return score;
}

function min_value(board, depth, alpha, beta) {
    if (depth === 0 || get_available_moves(player, board).length === 0) return utility(board);
    let minEval = INFINITY;
    for (let move of get_available_moves(player, board)) {
        let pIdx = getPieceIndex(board.pieces, move.from.row, move.from.col);
        if (pIdx === -1) continue;
        let newBoard = movePiece(copy_board(board), board.pieces[pIdx], move.from, move.to, 1, false);
        newBoard.turn = computer;
        let eval = max_value(newBoard, depth - 1, alpha, beta);
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, eval);
        if (beta <= alpha) break;
    }
    return minEval;
}

function max_value(board, depth, alpha, beta) {
    if (depth === 0 || get_available_moves(computer, board).length === 0) return utility(board);
    let maxEval = NEG_INFINITY;
    for (let move of get_available_moves(computer, board)) {
        let pIdx = getPieceIndex(board.pieces, move.from.row, move.from.col);
        if (pIdx === -1) continue;
        let newBoard = movePiece(copy_board(board), board.pieces[pIdx], move.from, move.to, 1, false);
        newBoard.turn = player;
        let eval = min_value(newBoard, depth - 1, alpha, beta);
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, eval);
        if (alpha >= beta) break;
    }
    return maxEval;
}

async function aiMove() {
    let moves = get_available_moves(computer, currentBoard);
    if (!moves.length) return;
    let bestMove = null, bestScore = NEG_INFINITY;
    for (let move of moves) {
        let pIdx = getPieceIndex(currentBoard.pieces, move.from.row, move.from.col);
        if (pIdx === -1) continue;
        let newBoard = movePiece(copy_board(currentBoard), currentBoard.pieces[pIdx], move.from, move.to, 1, false);
        newBoard.turn = player;
        let score = min_value(newBoard, 6, NEG_INFINITY, INFINITY);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    if (bestMove) {
        let pIdx = getPieceIndex(currentBoard.pieces, bestMove.from.row, bestMove.from.col);
        movePiece.moves = [];
        let tempBoard = movePiece(currentBoard, currentBoard.pieces[pIdx], bestMove.from, bestMove.to, 1, true);
        let moveSeq = movePiece.moves.slice();

        for (let m of moveSeq) {
            // Animate the move
            await animateMove(m.from, m.to, 900);

            // Remove the captured checker visually (if this was a jump)
            if (m.move_type === "jump") {
                let jumpedRow = m.from.row + Math.sign(m.to.row - m.from.row);
                let jumpedCol = m.from.col + Math.sign(m.to.col - m.from.col);
                // Find the SVG circle for the captured checker and remove it
                d3.select("#checkersBoard").selectAll("circle")
                    .filter(function(d) {
                        return d && d.row === jumpedRow && d.col === jumpedCol;
                    })
                    .remove();
            }

            // Now update the board state, but do NOT redraw yet
            let idx = getPieceIndex(currentBoard.pieces, m.from.row, m.from.col);
            if (idx === -1) continue;
            currentBoard = movePiece(currentBoard, currentBoard.pieces[idx], m.from, m.to, 1, true);

            // Wait a bit before the next jump
            await new Promise(res => setTimeout(res, 350));
        }
        currentBoard.turn = player;
        showBoardState();
        updateScoreboard();
        forceJump = false;
        forceJumpPiece = null;
    }
}

// --- UI: Highlighting and Interaction ---

function clearHighlights() {
    d3.select("#checkersBoard").select("g.highlight-layer").selectAll("*").remove();
    highlightedCells = [];
}

function highlightMoves(moves) {
    clearHighlights();
    let highlightLayer = d3.select("#checkersBoard").select("g.highlight-layer");
    if (highlightLayer.empty())
        highlightLayer = d3.select("#checkersBoard").insert("g", ":first-child").attr("class", "highlight-layer");
    moves.forEach(move => {
        let cell = currentBoard.cells[getCellIndex(move.to.row, move.to.col)];
        let coords = mapCellToCoordinates(board_origin, cell_width, cell);
        highlightLayer.append("rect")
            .attr("x", coords.x + 5).attr("y", coords.y + 5)
            .attr("width", cell_width - 10).attr("height", cell_width - 10)
            .attr("rx", 10).attr("ry", 10)
            .attr("class", move.move_type === "jump" ? "cell-highlight-jump" : "cell-highlight-move");
        highlightedCells.push({row: move.to.row, col: move.to.col, type: move.move_type});
    });
}

function mobilePieceTapHandler(d) {
    if (currentBoard.turn !== player || currentBoard.gameOver) return;

    // If forced jump, only allow selecting the forced piece
    if (forceJump && (!forceJumpPiece || d.row !== forceJumpPiece.row || d.col !== forceJumpPiece.col)) {
        return;
    }

    // Enforce forced jumps: only allow selecting pieces that can jump if any jumps are available
    let allMoves = get_available_moves(player, currentBoard);
    let hasJump = allMoves.some(m => m.move_type === "jump");
    if (hasJump) {
        let pieceJumps = get_available_piece_moves(currentBoard, d, player).filter(m => m.move_type === "jump");
        if (pieceJumps.length === 0) {
            // Highlight all pieces that can jump
            highlightJumpingPieces();
            return; // This piece can't jump, don't allow selection
        }
    }

    // Remove jumper highlight if present
    d3.select("#checkersBoard").selectAll("circle.jumper-highlight").remove();

    if (selectedPiece && selectedPiece.row === d.row && selectedPiece.col === d.col) {
        selectedPiece = null;
        clearHighlights();
        showBoardState();
        return;
    }
    selectedPiece = d;
    showBoardState();
}

function highlightJumpingPieces() {
    let jumpers = currentBoard.pieces.filter(p =>
        Math.sign(p.state) === Math.sign(player) &&
        get_available_piece_moves(currentBoard, p, player).some(m => m.move_type === "jump")
    );
    let boardCanvas = d3.select("#checkersBoard");
    // Remove any previous highlight
    boardCanvas.selectAll("circle.jumper-highlight").remove();
    // Overlay a ring highlight on each jumping piece
    boardCanvas.select("g").selectAll("circle.jumper-highlight")
        .data(jumpers)
        .enter()
        .append("circle")
        .attr("class", "jumper-highlight")
        .attr("cx", d => mapCellToCoordinates(board_origin, cell_width, d).x + cell_width / 2)
        .attr("cy", d => mapCellToCoordinates(board_origin, cell_width, d).y + cell_width / 2)
        .attr("r", cell_width / 2.5 + 6)
        .attr("stroke", "#FFD700")
        .attr("stroke-width", 6)
        .attr("fill", "none")
        .attr("pointer-events", "none");
}

async function mobileCellTapHandler(cell) {
    if (!selectedPiece || currentBoard.turn !== player || currentBoard.gameOver) return;
    let moves = get_available_piece_moves(currentBoard, selectedPiece, player);
    let move = moves.find(m => m.to.row === cell.row && m.to.col === cell.col);
    if (move) {
        let pieceIndex = getPieceIndex(currentBoard.pieces, selectedPiece.row, selectedPiece.col);
        if (pieceIndex === -1) return;

        // Get the full jump sequence (including multi-jumps)
        movePiece.moves = [];
        let tempBoard = movePiece(currentBoard, currentBoard.pieces[pieceIndex], move.from, move.to, 1, true);
        let moveSeq = movePiece.moves.slice();

        // Animate each jump/slide in the sequence
        for (let m of moveSeq) {
            // Animate the move
            await animateMove(m.from, m.to, 900);

            // Remove the captured checker visually (if this was a jump)
            if (m.move_type === "jump") {
                let jumpedRow = m.from.row + Math.sign(m.to.row - m.from.row);
                let jumpedCol = m.from.col + Math.sign(m.to.col - m.from.col);
                // Find the SVG circle for the captured checker and remove it
                d3.select("#checkersBoard").selectAll("circle")
                    .filter(function(d) {
                        return d && d.row === jumpedRow && d.col === jumpedCol;
                    })
                    .remove();
            }

            // Now update the board state, but do NOT redraw yet
            let idx = getPieceIndex(currentBoard.pieces, m.from.row, m.from.col);
            if (idx === -1) continue;
            currentBoard = movePiece(currentBoard, currentBoard.pieces[idx], m.from, m.to, 1, true);

            // Wait a bit before the next jump
            await new Promise(res => setTimeout(res, 350));
        }

        // After move, check if another jump is available for this piece (shouldn't be, but for safety)
        let lastMove = moveSeq[moveSeq.length - 1];
        let movedPiece = currentBoard.pieces[getPieceIndex(currentBoard.pieces, lastMove.to.row, lastMove.to.col)];
        let moreJumps = get_available_piece_moves(currentBoard, movedPiece, player).filter(m => m.move_type === "jump");
        if (lastMove.move_type === "jump" && moreJumps.length) {
            // Force player to continue jumping with this piece (shouldn't happen, but just in case)
            forceJump = true;
            forceJumpPiece = movedPiece;
            selectedPiece = movedPiece;
            showBoardState();
            updateScoreboard();
            return;
        }

        // Otherwise, end turn
        selectedPiece = null;
        clearHighlights();
        currentBoard.turn = computer;
        showBoardState();
        updateScoreboard();
        forceJump = false;
        forceJumpPiece = null;
        setTimeout(() => { aiMove(); }, 400);
    }
}

function showBoardState() {
    let boardCanvas = d3.select("#checkersBoard");
    boardCanvas.selectAll("g").remove();
    drawBoard(board_origin, cell_width, boardCanvas);
    if (selectedPiece) {
        let allMoves = get_available_moves(player, currentBoard);
        let hasJump = allMoves.some(m => m.move_type === "jump");
        let moves = get_available_piece_moves(currentBoard, selectedPiece, player);
        if (forceJump || hasJump) {
            moves = moves.filter(m => m.move_type === "jump");
        }
        highlightMoves(moves);
    }
}

function updateScoreboard() {
    let redCount = currentBoard.pieces.filter(p => (p.state === red || p.state === redKing) && p.row >= 0).length;
    let blackCount = currentBoard.pieces.filter(p => (p.state === black || p.state === blackKing) && p.row >= 0).length;
    d3.select("#redScore").html("Red: " + redCount);
    d3.select("#blackScore").html("Black: " + blackCount);
    // Winner
    let winner = 0;
    if (redCount === 0) winner = computer;
    else if (blackCount === 0) winner = player;
    else if (!get_available_moves(player, currentBoard).length && !get_available_moves(computer, currentBoard).length) winner = "draw";
    let label = "";
    if (winner === player) label = "Red Wins!!";
    else if (winner === computer) label = "Black Wins!!";
    else if (winner === "draw") label = "Game Draw - No More Valid Moves!";
    d3.select("#winner").html(label);
}

function printMoves() {
    if (!movePiece.moves || movePiece.moves.length === 0) {
        alert("No moves have been made yet!");
        return;
    }
    let moveList = movePiece.moves.map((m, i) =>
        `<li>${i + 1}. ${m.move_type.toUpperCase()} from (${m.from.row + 1},${m.from.col + 1}) to (${m.to.row + 1},${m.to.col + 1})</li>`
    ).join('');
    let printWindow = window.open('', '_blank', 'noopener');
    printWindow.document.write(`
        <html>
        <head>
            <title>Checkers Move List</title>
            <style>
                @media print {
                    @page { size: auto; margin: 20mm; }
                    html, body { width: auto !important; height: auto !important; }
                }
                body { font-family: Arial, sans-serif; padding: 20px; }
                h2 { text-align: center; }
                ul { font-size: 16px; }
            </style>
        </head>
        <body>
            <h2>Checkers Move List</h2>
            <ul>${moveList}</ul>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

function animateMove(from, to, duration = 600) {
    return new Promise(resolve => {
        let circles = d3.select("#checkersBoard").selectAll("circle").nodes();
        let found = null;
        for (let c of circles) {
            let cx = +c.getAttribute("cx");
            let cy = +c.getAttribute("cy");
            let r = +c.getAttribute("r");
            let cellCoords = mapCellToCoordinates(board_origin, cell_width, from);
            let expectedX = cellCoords.x + cell_width / 2;
            let expectedY = cellCoords.y + cell_width / 2;
            if (Math.abs(cx - expectedX) < 2 && Math.abs(cy - expectedY) < 2) {
                found = c;
                break;
            }
        }
        if (!found) return resolve();

        let toCoords = mapCellToCoordinates(board_origin, cell_width, to);
        let destX = toCoords.x + cell_width / 2;
        let destY = toCoords.y + cell_width / 2;

        d3.select(found)
            .transition()
            .duration(duration)
            .attr("cx", destX)
            .attr("cy", destY)
            .on("end", resolve);
    });
}

// --- Export for HTML ---
window.printMoves = printMoves;
window.startGame = startGame;
window.showBoardState = showBoardState;
window.updateScoreboard = updateScoreboard;