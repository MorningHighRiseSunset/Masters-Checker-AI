window.onload = function () {
  // The initial setup
  var gameBoard = [
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0]
  ];
  // Arrays to store the instances
  var pieces = [];
  var tiles = [];
  
  // Array to store moves
  var moveHistory = [];
  var moveList = []; // New array to store moves in SAN format

  // Function to get tile number based on position
function getTileNumber(position) {
  if (!position || position.length !== 2) return null; // Ensure position is valid
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i].position[0] === position[0] && tiles[i].position[1] === position[1]) {
      return i + 1; // Tile numbers are 1-based
    }
  }
  return null;
}

// Function to update move history
function updateMoveHistory(fromPosition, toPosition, isJump, player) {
  const fromTileNumber = getTileNumber(fromPosition);
  const toTileNumber = getTileNumber(toPosition);
  if (fromTileNumber === null || toTileNumber === null) return; // Ensure tile numbers are valid
  const move = `${fromTileNumber} ${isJump ? 'X' : '-'} ${toTileNumber}`;
  
  // Determine player name and color based on the current player's turn
  const playerName = player === 1 ? 'Player 1' : 'Player 2';
  const playerColor = player === 1 ? 'player1-color' : 'player2-color';
  const moveText = `<span class="${playerColor}">${playerName}</span>: ${move}`;
  
  // Check if the last move is the same as the current move
  if (moveHistory.length === 0 || moveHistory[moveHistory.length - 1] !== move) {
    // Check if a regular move exists and replace it with a jump if necessary
    const regularMove = `${fromTileNumber} - ${toTileNumber}`;
    if (isJump && moveHistory.includes(regularMove)) {
      const index = moveHistory.indexOf(regularMove);
      moveHistory[index] = move;
      moveList[index] = { san: moveText };
      $('#moveHistory div').eq(index).html(moveText);
    } else {
      moveHistory.push(move);
      moveList.push({ san: moveText }); // Store move in SAN format
      $('#moveHistory').append("<div>" + moveText + "</div>"); // Assuming you have a div with id 'moveHistory'
    }
    // Scroll to the bottom of the move history
    $('#moveHistory').scrollTop($('#moveHistory')[0].scrollHeight);
  }
}
  // Distance formula
  var dist = function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
  }

  // Piece object
  function Piece(element, position) {
    this.allowedtomove = true;
    this.element = element;
    this.position = position;
    this.player = this.element.attr("id") < 12 ? 1 : 2;
    this.king = false;

    this.makeKing = function () {
      this.element.css("backgroundImage", "url('img/king" + this.player + ".png')");
      this.king = true;
      console.log("Player " + this.player + "'s piece has been crowned a king!");
      console.log("Piece reached the opposite side and became a king!");
      updateMoveHistory(this.position, this.position, false, this.player); // Pass player
    }
    

    this.move = function (tile) {
      this.element.removeClass('selected');
      if (!Board.isValidPlacetoMove(tile.position[0], tile.position[1])) return false;
    
      if ((this.player == 1 && !this.king && tile.position[0] < this.position[0]) ||
          (this.player == 2 && !this.king && tile.position[0] > this.position[0])) {
        return false;
      }
    
      const fromPosition = this.position.slice();
    
      Board.board[this.position[0]][this.position[1]] = 0;
      Board.board[tile.position[0]][tile.position[1]] = this.player;
      this.position = [tile.position[0], tile.position[1]];
      this.element.css('top', Board.dictionary[this.position[0]]);
      this.element.css('left', Board.dictionary[this.position[1]]);
    
      if (!this.king && (this.position[0] == 0 || this.position[0] == 7)) {
        this.makeKing();
      }
    
      updateMoveHistory(fromPosition, this.position, false, this.player); // Pass player
    
      return true;
    };

    this.canJumpAny = function () {
      return (this.canOpponentJump([this.position[0] + 2, this.position[1] + 2]) ||
              this.canOpponentJump([this.position[0] + 2, this.position[1] - 2]) ||
              this.canOpponentJump([this.position[0] - 2, this.position[1] + 2]) ||
              this.canOpponentJump([this.position[0] - 2, this.position[1] - 2]));
    };

    this.canOpponentJump = function (newPosition) {
      var dx = newPosition[1] - this.position[1];
      var dy = newPosition[0] - this.position[0];
    
      // Ensure object doesn't go backwards if not a king
      if ((this.player == 1 && !this.king && newPosition[0] < this.position[0]) ||
          (this.player == 2 && !this.king && newPosition[0] > this.position[0])) {
        return false;
      }
    
      // Must be in bounds
      if (newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0) return false;
    
      var tileToCheckx = this.position[1] + dx / 2;
      var tileToChecky = this.position[0] + dy / 2;
    
      if (tileToCheckx > 7 || tileToChecky > 7 || tileToCheckx < 0 || tileToChecky < 0) return false;
    
      // If there is a piece there and there is no piece in the space after that
      if (!Board.isValidPlacetoMove(tileToChecky, tileToCheckx) && Board.isValidPlacetoMove(newPosition[0], newPosition[1])) {
        for (let pieceIndex in pieces) {
          if (pieces[pieceIndex].position[0] == tileToChecky && pieces[pieceIndex].position[1] == tileToCheckx) {
            if (this.player != pieces[pieceIndex].player) {
              return pieces[pieceIndex]; // Return the piece sitting there
            }
          }
        }
      }
      return false;
    };

    this.opponentJump = function (tile) {
      var pieceToRemove = this.canOpponentJump(tile.position);
      if (pieceToRemove) {
        pieceToRemove.remove();
        // Notify that a piece has been captured
        console.log("Player " + pieceToRemove.player + "'s piece has been captured!");
        return true;
      }
      return false;
    };
    

    this.remove = function () {
      this.element.css("display", "none");
      if (this.player == 1) {
        $('#player2').append("<div class='capturedPiece'></div>");
        Board.score.player2 += 1;
      } else {
        $('#player1').append("<div class='capturedPiece'></div>");
        Board.score.player1 += 1;
      }
      Board.board[this.position[0]][this.position[1]] = 0;
      this.position = [];
      Board.checkForWin();
    }
  }

  // Tile object
  function Tile(element, position) {
    this.element = element;
    this.position = position;

    this.inRange = function (piece) {
      for (let k of pieces)
        if (k.position[0] == this.position[0] && k.position[1] == this.position[1]) return 'wrong';
      if (!piece.king && piece.player == 1 && this.position[0] < piece.position[0]) return 'wrong';
      if (!piece.king && piece.player == 2 && this.position[0] > piece.position[0]) return 'wrong';
      if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)) {
        return 'regular'; // Regular move
      } else if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == 2 * Math.sqrt(2)) {
        return 'jump'; // Jump move
      }
    };
  }

  // Board object
  var Board = {
    board: gameBoard,
    score: {
      player1: 0,
      player2: 0
    },
    playerTurn: 1,
    jumpexist: false,
    continuousjump: false,
    tilesElement: $('div.tiles'),
    dictionary: ["0vmin", "10vmin", "20vmin", "30vmin", "40vmin", "50vmin", "60vmin", "70vmin", "80vmin", "90vmin"],
    computerDifficulty: 'easy', // Default difficulty

    // Initialize the 8x8 board
    initalize: function () {
      var countPieces = 0;
      var countTiles = 0;
      for (let row in this.board) {
        for (let column in this.board[row]) {
          if (row % 2 == 1) {
            if (column % 2 == 0) {
              countTiles = this.tileRender(row, column, countTiles);
            }
          } else {
            if (column % 2 == 1) {
              countTiles = this.tileRender(row, column, countTiles);
            }
          }
          if (this.board[row][column] == 1) {
            countPieces = this.playerPiecesRender(1, row, column, countPieces);
          } else if (this.board[row][column] == 2) {
            countPieces = this.playerPiecesRender(2, row, column, countPieces);
          }
        }
      }
      $('#difficultyMessage').text("EASY"); // Display initial difficulty message
    },

    tileRender: function (row, column, countTiles) {
    this.tilesElement.append("<div class='tile' id='tile" + countTiles + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'><span class='tile-number'>" + (countTiles + 1) + "</span></div>");
    tiles[countTiles] = new Tile($("#tile" + countTiles), [parseInt(row), parseInt(column)]);
    return countTiles + 1;
  },

    playerPiecesRender: function (playerNumber, row, column, countPieces) {
      $(`.player${playerNumber}pieces`).append("<div class='piece' id='" + countPieces + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
      pieces[countPieces] = new Piece($("#" + countPieces), [parseInt(row), parseInt(column)]);
      return countPieces + 1;
    },

    // Check if the location has an object
    isValidPlacetoMove: function (row, column) {
      if (row < 0 || row > 7 || column < 0 || column > 7) return false;
      return this.board[row][column] == 0;
    },

    // Change the active player
    changePlayerTurn: function () {
      this.playerTurn = this.playerTurn == 1 ? 2 : 1;
      $('.turn').css("background", this.playerTurn == 1 ? "linear-gradient(to right, #D3D3D3 50%, transparent 50%)" : "linear-gradient(to right, transparent 50%, #D3D3D3 50%)");
      this.check_if_jump_exist();
      if (this.playerTurn == 2) {
        this.computerMove();
      }
    },

    // Check for win conditions
    checkForWin: function () {
      if (this.score.player1 >= 12) {
        // Record the win in move history instead of alerting
        updateMoveHistory("Player 1 wins!");
        this.showNewGameButton();
      } else if (this.score.player2 >= 12) {
        // Record the win in move history instead of alerting
        updateMoveHistory("Player 2 wins!");
        this.showNewGameButton();
      }
    },

    showNewGameButton: function() {
      $('#newGameBtn').show(); // Show the new game button
    },


    check_if_jump_exist: function () {
      this.jumpexist = false;
      this.continuousjump = false;
      for (let k of pieces) {
        k.allowedtomove = false;
        if (k.position.length != 0 && k.player == this.playerTurn && k.canJumpAny()) {
          this.jumpexist = true;
          k.allowedtomove = true;
        }
      }
      if (!this.jumpexist) {
        for (let k of pieces) k.allowedtomove = true;
      }
    },

    // Computer move logic
    computerMove: function () {
      // Implement different difficulty levels
      switch (this.computerDifficulty) {
        case 'easy':
          this.computerEasyMove();
          break;
        case 'medium':
          this.computerMediumMove();
          break;
        case 'hard':
          this.computerHardMove();
          break;
      }
    },

    computerEasyMove: function () {
      // Simple random move logic for easy difficulty
      let possibleMoves = [];
      for (let piece of pieces) {
        if (piece.player == 2 && piece.allowedtomove) {
          for (let tile of tiles) {
            if (tile.inRange(piece) == 'regular' && this.isValidPlacetoMove(tile.position[0], tile.position[1])) {
              possibleMoves.push({ piece: piece, tile: tile });
            }
          }
        }
      }
      if (possibleMoves.length > 0) {
        let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        move.piece.move(move.tile);
        updateMoveHistory("E" + move.piece.element.attr("id") + " - E" + move.tile.element.attr("id"));
        this.changePlayerTurn();
      }
    },

    computerMediumMove: function () {
      // Implement medium difficulty logic
      // For now, it will use the same logic as easy
      this.computerEasyMove();
    },

    computerHardMove: function () {
      // Implement hard difficulty logic
      // For now, it will use the same logic as easy
      this.computerEasyMove();
    }
  }

  // Initialize the board
  Board.initalize();

  /***
  Events
  ***/

  // Select the piece on click if it is the player's turn
  $('.piece').on("click", function () {
    var selected;
    var isPlayersTurn = ($(this).parent().attr("class").split(' ')[0] == "player" + Board.playerTurn + "pieces");
    if (isPlayersTurn && Board.playerTurn == 1) { // Ensure player can only move beige pieces
      if (!Board.continuousjump && pieces[$(this).attr("id")].allowedtomove) {
        if ($(this).hasClass('selected')) selected = true;
        $('.piece').removeClass('selected');
        if (!selected) {
          $(this).addClass('selected');
        }
      } else {
        let message = !Board.continuousjump ? "Jump exists for other pieces, that piece is not allowed to move" : "Continuous jump exists, you have to jump the same piece";
        console.log(message);
      }
    }
  });

  $('.tile').on("click", function () {
    if ($('.selected').length != 0) {
      var tileID = $(this).attr("id").replace(/tile/, '');
      var tile = tiles[tileID];
      var piece = pieces[$('.selected').attr("id")];
      var inRange = tile.inRange(piece);
      if (inRange != 'wrong') {
        if (inRange == 'jump') {
          if (piece.opponentJump(tile)) {
            var fromPosition = piece.position.slice(); // Store the original position
            piece.move(tile);
            updateMoveHistory(fromPosition, tile.position, true); // Update move history with jump
            if (piece.canJumpAny()) {
              piece.element.addClass('selected');
              Board.continuousjump = true;
            } else {
              Board.changePlayerTurn();
            }
          }
        } else if (inRange == 'regular' && !Board.jumpexist) {
          if (!piece.canJumpAny()) {
            var fromPosition = piece.position.slice(); // Store the original position
            piece.move(tile);
            updateMoveHistory(fromPosition, tile.position, false); // Update move history with regular move
            Board.changePlayerTurn();
          } else {
            alert("You must jump when possible!");
          }
        }
      }
    }
  });

  // New buttons for copying and printing moves
  $('#copyMovesBtn').on('click', function() {
    var movesText = moveList.map(move => move.san).join(', '); // Collect moves in SAN format
    navigator.clipboard.writeText(movesText).then(function() {
      swal("Success", "Moves copied to clipboard!", "success");
    }, function(err) {
      swal("Error", "Failed to copy moves: " + err, "error");
    });
  });

  $('#printMovesBtn').on('click', function() {
    var movesText = moveList.map(move => move.san).join(', '); // Collect moves in SAN format
    var printWindow = window.open('', '', 'height=400,width=600');
    printWindow.document.write('<html><head><title>Checkers Moves</title></head><body>');
    printWindow.document.write('<h1>Recorded Checkers Moves</h1>');
    printWindow.document.write('<pre>' + movesText + '</pre>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  });

Board.clear = function (callback) {
  if (callback) {
    localStorage.setItem('consoleMessage', callback.message);
    $('#difficultyMessage').text(callback.message); // Update the HTML message
  }
  location.reload();
};

$(document).ready(function() {
  var message = localStorage.getItem('consoleMessage');
  if (message) {
    console.log(message);
    $('#difficultyMessage').text(message); // Update the HTML message on page load
    localStorage.removeItem('consoleMessage');
  }
});

  $('#easyModeBtn').on('click', function() {
    Board.clear({ message: "EASY" });
    Board.computerDifficulty = 'easy';
  });

  $('#mediumModeBtn').on('click', function() {
    Board.clear({ message: "MEDIUM" });
    Board.computerDifficulty = 'medium';
  });

  $('#hardModeBtn').on('click', function() {
    Board.clear({ message: "HARD" });
    Board.computerDifficulty = 'hard';
  });

  $('#extremeModeBtn').on('click', function() {
    Board.clear({ message: "EXTREME" });
    Board.computerDifficulty = 'extreme';
  });

  Board.computerEasyMove = function () {
    let possibleMoves = [];
    let jumpMoves = [];
  
    for (let piece of pieces) {
      if (piece.player == 2 && piece.allowedtomove) {
        for (let tile of tiles) {
          let moveType = tile.inRange(piece);
          if (moveType == 'regular' && this.isValidPlacetoMove(tile.position[0], tile.position[1])) {
            possibleMoves.push({ piece: piece, tile: tile });
          } else if (moveType == 'jump' && piece.canOpponentJump(tile.position)) {
            jumpMoves.push({ piece: piece, tile: tile });
          }
        }
      }
    }
  
    if (jumpMoves.length > 0) {
      // Prioritize jump moves
      let move = jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
      setTimeout(() => {
        const fromPosition = move.piece.position.slice(); // Store the original position
        move.piece.opponentJump(move.tile);
        move.piece.move(move.tile);
        updateMoveHistory(fromPosition, move.tile.position, true); // Use 'X' for jump
        if (move.piece.canJumpAny()) {
          this.computerEasyMove(); // Continue jumping if possible
        } else {
          this.changePlayerTurn();
        }
      }, 2000); // 2000ms delay
    } else if (possibleMoves.length > 0) {
      let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      setTimeout(() => {
        const fromPosition = move.piece.position.slice(); // Store the original position
        move.piece.move(move.tile);
        updateMoveHistory(fromPosition, move.tile.position, false); // Use '-' for regular move
        this.changePlayerTurn();
      }, 2000); // 2000ms delay
    }
  };
  
  Board.computerMediumMove = function () {
    let possibleMoves = [];
    let jumpMoves = [];
    let safeMoves = [];
  
    for (let piece of pieces) {
      if (piece.player == 2 && piece.allowedtomove) {
        for (let tile of tiles) {
          let moveType = tile.inRange(piece);
          if (moveType == 'regular' && this.isValidPlacetoMove(tile.position[0], tile.position[1])) {
            possibleMoves.push({ piece: piece, tile: tile });
            // Check if the move is safe
            if (!this.isMoveDangerous(piece, tile)) {
              safeMoves.push({ piece: piece, tile: tile });
            }
          } else if (moveType == 'jump' && piece.canOpponentJump(tile.position)) {
            jumpMoves.push({ piece: piece, tile: tile });
          }
        }
      }
    }
  
    if (jumpMoves.length > 0) {
      // Prioritize jump moves
      let move = jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
      setTimeout(() => {
        move.piece.opponentJump(move.tile);
        move.piece.move(move.tile);
        updateMoveHistory("E" + move.piece.element.attr("id") + " X E" + move.tile.element.attr("id"));
        if (move.piece.canJumpAny()) {
          this.computerMediumMove(); // Continue jumping if possible
        } else {
          this.changePlayerTurn();
        }
      }, 3000); // 3000ms delay
    } else if (safeMoves.length > 0) {
      // Prioritize safe moves
      let move = safeMoves[Math.floor(Math.random() * safeMoves.length)];
      setTimeout(() => {
        move.piece.move(move.tile);
        updateMoveHistory("E" + move.piece.element.attr("id") + " - E" + move.tile.element.attr("id"));
        this.changePlayerTurn();
      }, 3000); // 3000ms delay
    } else if (possibleMoves.length > 0) {
      // If no safe moves, choose any possible move
      let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      setTimeout(() => {
        move.piece.move(move.tile);
        updateMoveHistory("E" + move.piece.element.attr("id") + " - E" + move.tile.element.attr("id"));
        this.changePlayerTurn();
      }, 3000); // 3000ms delay
    }
  };

  Board.isMoveDangerous = function (piece, tile) {
    let opponentPieces = pieces.filter(p => p.player == 1);
    for (let opponentPiece of opponentPieces) {
      if (opponentPiece.canOpponentJump(tile.position)) {
        return true;
      }
    }
    return false;
  };
  
  Board.computerHardMove = function () {
    const depth = 5; // Depth for the minimax algorithm
  
    // Check if we are in the opening phase
    if (this.isOpeningPhase()) {
      const openingMove = this.getOpeningMove();
      if (openingMove) {
        const { piece, tile } = openingMove;
        setTimeout(() => {
          piece.move(tile);
          updateMoveHistory("E" + piece.element.attr("id") + " - E" + tile.element.attr("id"));
          this.changePlayerTurn();
        }, 2000); // 2000ms delay
        return;
      }
    }
  
    const bestMove = this.minimax(Board, depth, true, -Infinity, Infinity, {});
    if (bestMove) {
      const { piece, tile } = bestMove;
      setTimeout(() => {
        piece.move(tile);
        updateMoveHistory("E" + piece.element.attr("id") + " - E" + tile.element.attr("id"));
        this.changePlayerTurn();
      }, 2000); // 2000ms delay
    }
  };
  
  Board.isOpeningPhase = function () {
    // Define the opening phase as the first 10 moves
    return moveHistory.length < 10;
  };
  
  Board.getOpeningMove = function () {
    // Define some advanced opening moves
    const openingBooks = [
      // Example opening moves
      [{ pieceId: 12, tileId: 20 }, { pieceId: 13, tileId: 21 }],
      [{ pieceId: 14, tileId: 22 }, { pieceId: 15, tileId: 23 }],
      // Add more opening moves as needed
    ];
  
    for (const book of openingBooks) {
      if (moveHistory.length < book.length) {
        const move = book[moveHistory.length];
        const piece = pieces[move.pieceId];
        const tile = tiles[move.tileId];
        if (piece && tile && piece.player === 2) {
          return { piece, tile };
        }
      }
    }
    return null;
  };
  
  Board.minimax = function (board, depth, isMaximizingPlayer, alpha, beta, transpositionTable) {
    const boardKey = JSON.stringify(board.board);
    if (transpositionTable[boardKey]) {
      return transpositionTable[boardKey];
    }
  
    if (depth === 0 || this.isGameOver(board)) {
      return { score: this.evaluateBoard(board) };
    }
  
    let bestMove = null;
  
    if (isMaximizingPlayer) {
      let maxEval = -Infinity;
      const moves = this.getAllPossibleMoves(board, 2); // Get all possible moves for the computer
      this.orderMoves(moves); // Order moves to improve alpha-beta pruning
      for (const move of moves) {
        const newBoard = this.makeMove(board, move);
        const evaluation = this.minimax(newBoard, depth - 1, false, alpha, beta, transpositionTable).score;
        if (evaluation > maxEval) {
          maxEval = evaluation;
          bestMove = move;
        }
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) {
          break;
        }
      }
      transpositionTable[boardKey] = bestMove ? { ...bestMove, score: maxEval } : { score: maxEval };
      return transpositionTable[boardKey];
    } else {
      let minEval = Infinity;
      const moves = this.getAllPossibleMoves(board, 1); // Get all possible moves for the opponent
      this.orderMoves(moves); // Order moves to improve alpha-beta pruning
      for (const move of moves) {
        const newBoard = this.makeMove(board, move);
        const evaluation = this.minimax(newBoard, depth - 1, true, alpha, beta, transpositionTable).score;
        if (evaluation < minEval) {
          minEval = evaluation;
          bestMove = move;
        }
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) {
          break;
        }
      }
      transpositionTable[boardKey] = bestMove ? { ...bestMove, score: minEval } : { score: minEval };
      return transpositionTable[boardKey];
    }
  };
  
  Board.orderMoves = function (moves) {
    // Order moves to prioritize captures and king moves
    moves.sort((a, b) => {
      if (a.tile.inRange(a.piece) === 'jump' && b.tile.inRange(b.piece) !== 'jump') {
        return -1;
      }
      if (a.tile.inRange(a.piece) !== 'jump' && b.tile.inRange(b.piece) === 'jump') {
        return 1;
      }
      if (a.piece.king && !b.piece.king) {
        return -1;
      }
      if (!a.piece.king && b.piece.king) {
        return 1;
      }
      return 0;
    });
  };
  
  Board.evaluateBoard = function (board) {
    let score = 0;
    for (let row of board.board) {
      for (let cell of row) {
        if (cell === 2) {
          score += 5; // Computer piece
        } else if (cell === 1) {
          score -= 5; // Opponent piece
        } else if (cell === 2.1) {
          score += 10; // Computer king
        } else if (cell === 1.1) {
          score -= 10; // Opponent king
        }
      }
    }
    // Additional evaluation criteria
    score += this.evaluatePieceSafety(board);
    score += this.evaluateBoardControl(board);
    return score;
  };
  
  Board.evaluatePieceSafety = function (board) {
    let safetyScore = 0;
    for (let piece of pieces) {
      if (piece.player === 2) {
        if (this.isMoveDangerous(piece, { position: piece.position })) {
          safetyScore -= 3; // Penalize unsafe pieces
        } else {
          safetyScore += 1; // Reward safe pieces
        }
      }
    }
    return safetyScore;
  };
  
  Board.evaluateBoardControl = function (board) {
    let controlScore = 0;
    for (let row = 2; row <= 5; row++) {
      for (let col = 2; col <= 5; col++) {
        if (board.board[row][col] === 2) {
          controlScore += 1; // Reward control of the center
        } else if (board.board[row][col] === 1) {
          controlScore -= 1; // Penalize opponent control of the center
        }
      }
    }
    return controlScore;
  };
  
  Board.isGameOver = function (board) {
    // Check if the game is over (either player has no pieces left or no valid moves)
    const player1Pieces = pieces.filter(p => p.player === 1 && p.position.length !== 0);
    const player2Pieces = pieces.filter(p => p.player === 2 && p.position.length !== 0);
    return player1Pieces.length === 0 || player2Pieces.length === 0 || this.getAllPossibleMoves(board, 1).length === 0 || this.getAllPossibleMoves(board, 2).length === 0;
  }

  
   // Extreme Mode AI 
   Board.computerExtremeMove = function () {
    if (this.playerTurn !== 2) return; // Ensure it's the computer's turn
  
    const depth = 20; // Further increased depth for the minimax algorithm
  
    // Check if we are in the opening phase
    if (this.isOpeningPhase()) {
      const openingMove = this.getOpeningMove();
      if (openingMove) {
        const { piece, tile } = openingMove;
        setTimeout(() => {
          piece.move(tile);
          updateMoveHistory("E" + piece.element.attr("id") + " - E" + tile.element.attr("id"));
          this.changePlayerTurn();
        }, 2000); // 2000ms delay
        return;
      }
    }
  
    // Implement midgame strategy
    if (this.isMidgamePhase()) {
      const midgameMove = this.getMidgameMove();
      if (midgameMove) {
        const { piece, tile } = midgameMove;
        setTimeout(() => {
          piece.move(tile);
          updateMoveHistory("E" + piece.element.attr("id") + " - E" + tile.element.attr("id"));
          this.changePlayerTurn();
        }, 2000); // 2000ms delay
        return;
      }
    }
  
    // Proceed with minimax if not in the opening or midgame phase
    const bestMove = this.minimax(this.board, depth, true, -Infinity, Infinity);
  
    if (bestMove) {
      const { piece, tile } = bestMove;
      if (!this.isMoveLeadingToImmediateCapture(piece, tile) && !this.isMoveLeavingSquareOpenForCapture(piece, tile)) {
        this.visualScanTiles(tile); // Add visual scanning effect
        setTimeout(() => {
          piece.move(tile);
          updateMoveHistory("E" + piece.element.attr("id") + " - E" + tile.element.attr("id"));
          this.changePlayerTurn();
        }, 2000); // 2000ms delay
      }
    } else {
      if (confirm("The game has reached a stalemate. Play again?")) {
        this.clear();
      }
    }
  };

  Board.isMidgamePhase = function () {
    // Define the midgame phase as moves 10 to 30
    return moveHistory.length >= 10 && moveHistory.length < 30;
  };
  
  Board.getMidgameMove = function () {
    // Implement midgame strategy focusing on center control and piece safety
    let bestMove = null;
    let bestScore = -Infinity;
    for (let piece of pieces) {
      if (piece.player == 2 && piece.allowedtomove) {
        for (let tile of tiles) {
          if (tile.inRange(piece) !== 'wrong' && this.isValidPlacetoMove(tile.position[0], tile.position[1])) {
            const score = this.evaluateMove(piece, tile);
            if (score > bestScore) {
              bestScore = score;
              bestMove = { piece, tile };
            }
          }
        }
      }
    }
    return bestMove;
  };
  
  Board.isMoveLeavingSquareOpenForCapture = function (piece, tile) {
    // Simulate the move
    const originalPosition = piece.position.slice();
    const originalBoardValue = this.board[tile.position[0]][tile.position[1]];
    this.board[originalPosition[0]][originalPosition[1]] = 0;
    this.board[tile.position[0]][tile.position[1]] = piece.player;
  
    // Check if any opponent piece can capture the moved piece
    let isCapturePossible = false;
    let opponentPieces = pieces.filter(p => p.player == 1);
    for (let opponentPiece of opponentPieces) {
      const validMoves = this.getValidMoves(opponentPiece.position[0], opponentPiece.position[1]);
      for (let move of validMoves) {
        if (move.type === 'jump' && move.captures.some(capture => capture[0] === tile.position[0] && capture[1] === tile.position[1])) {
          isCapturePossible = true;
          break;
        }
      }
      if (isCapturePossible) break;
    }
  
    // Revert the simulated move
    this.board[originalPosition[0]][originalPosition[1]] = piece.player;
    this.board[tile.position[0]][tile.position[1]] = originalBoardValue;
  
    return isCapturePossible;
  };
  
  // Function to visually scan tiles
  Board.visualScanTiles = function (tile) {
    const adjacentPositions = [
      [tile.position[0] - 1, tile.position[1] - 1], [tile.position[0] - 1, tile.position[1] + 1],
      [tile.position[0] + 1, tile.position[1] - 1], [tile.position[0] + 1, tile.position[1] + 1]
    ];
  
    for (let [adjX, adjY] of adjacentPositions) {
      if (adjX >= 0 && adjX < 8 && adjY >= 0 && adjY < 8) {
        const adjTile = tiles.find(t => t.position[0] === adjX && t.position[1] === adjY);
        if (adjTile) {
          adjTile.element.addClass('scanning');
        }
      }
    }
  
    setTimeout(() => {
      $('.tile').removeClass('scanning');
    }, 1000); // Remove the scanning effect after 1 second
  };
  
  Board.evaluateBoard = function (board) {
    let score = 0;
    for (let row of board) {
        for (let cell of row) {
            if (cell === 2) score += 5; // Computer piece
            if (cell === 4) score += 10; // Computer king
            if (cell === 1) score -= 5; // Opponent piece
            if (cell === 3) score -= 10; // Opponent king
        }
    }
    // Additional evaluation criteria
    score += this.evaluatePieceSafety(board);
    score += this.evaluateBoardControl(board);
    score += this.evaluatePieceAdvancement(board); // New heuristic for piece advancement
    score += this.evaluateKingPotential(board); // New heuristic for king potential
    score += this.evaluateMobility(board); // New heuristic for mobility
    score += this.evaluatePieceClustering(board); // New heuristic for piece clustering
    score += this.evaluateEdgeSafety(board); // New heuristic for edge safety
    score += this.evaluateKingMobility(board); // New heuristic for king mobility
    score += this.evaluatePieceCentralization(board); // New heuristic for piece centralization
    return score;
};

// New heuristic for piece centralization
Board.evaluatePieceCentralization = function (board) {
  let centralizationScore = 0;
  for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
          if (board[x][y] === 2 || board[x][y] === 4) { // Check for computer pieces
              centralizationScore += (4 - Math.abs(4 - x)) + (4 - Math.abs(4 - y)); // Reward pieces closer to the center
          } else if (board[x][y] === 1 || board[x][y] === 3) { // Check for opponent pieces
              centralizationScore -= (4 - Math.abs(4 - x)) + (4 - Math.abs(4 - y)); // Penalize opponent pieces closer to the center
          }
      }
  }
  return centralizationScore;
};
  
  Board.evaluatePieceAdvancement = function (board) {
    let advancementScore = 0;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (board[x][y] === 2) {
          advancementScore += x; // Reward pieces closer to becoming kings
        } else if (board[x][y] === 1) {
          advancementScore -= (7 - x); // Penalize opponent pieces closer to becoming kings
        }
      }
    }
    return advancementScore;
  };
  
  Board.evaluateKingPotential = function (board) {
    let kingPotentialScore = 0;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (board[x][y] === 2 && x === 6) {
          kingPotentialScore += 5; // Reward pieces one step away from becoming kings
        } else if (board[x][y] === 1 && x === 1) {
          kingPotentialScore -= 5; // Penalize opponent pieces one step away from becoming kings
        }
      }
    }
    return kingPotentialScore;
  };
  
  Board.evaluatePieceSafety = function (board) {
    let safetyScore = 0;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (board[x][y] === 2 || board[x][y] === 4) { // Check for computer pieces
          if (this.isMoveDangerous({ position: [x, y] }, { position: [x, y] })) {
            safetyScore -= 100; // Extremely high penalty for unsafe pieces
          } else {
            safetyScore += 50; // High reward for safe pieces
          }
        }
      }
    }
    return safetyScore;
  };
  
  Board.evaluateBoardControl = function (board) {
    let controlScore = 0;
    for (let row = 2; row <= 5; row++) {
      for (let col = 2; col <= 5; col++) {
        if (board[row][col] === 2) {
          controlScore += 2; // Increased reward for control of the center
        } else if (board[row][col] === 1) {
          controlScore -= 2; // Increased penalty for opponent control of the center
        }
      }
    }
    return controlScore;
  };
  
  Board.evaluateMobility = function (board) {
    let mobilityScore = 0;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (board[x][y] === 2 || board[x][y] === 4) { // Check for computer pieces
          const moves = this.getValidMoves(x, y);
          mobilityScore += moves.length; // Reward pieces with more valid moves
        } else if (board[x][y] === 1 || board[x][y] === 3) { // Check for opponent pieces
          const moves = this.getValidMoves(x, y);
          mobilityScore -= moves.length; // Penalize opponent pieces with more valid moves
        }
      }
    }
    return mobilityScore;
  };
  
  Board.evaluatePieceClustering = function (board) {
    let clusteringScore = 0;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (board[x][y] === 2 || board[x][y] === 4) { // Check for computer pieces
          clusteringScore += this.getAdjacentPieces(board, x, y, 2).length; // Reward pieces that are clustered together
        } else if (board[x][y] === 1 || board[x][y] === 3) { // Check for opponent pieces
          clusteringScore -= this.getAdjacentPieces(board, x, y, 1).length; // Penalize opponent pieces that are clustered together
        }
      }
    }
    return clusteringScore;
  };
  
  Board.evaluateEdgeSafety = function (board) {
    let edgeSafetyScore = 0;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if ((x === 0 || x === 7 || y === 0 || y === 7) && (board[x][y] === 2 || board[x][y] === 4)) {
          edgeSafetyScore += 1; // Reward pieces that are on the edge of the board
        } else if ((x === 0 || x === 7 || y === 0 || y === 7) && (board[x][y] === 1 || board[x][y] === 3)) {
          edgeSafetyScore -= 1; // Penalize opponent pieces that are on the edge of the board
        }
      }
    }
    return edgeSafetyScore;
  };
  
  Board.evaluateKingMobility = function (board) {
    let kingMobilityScore = 0;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (board[x][y] === 4) { // Check for computer kings
          const moves = this.getValidMoves(x, y);
          kingMobilityScore += moves.length * 2; // Reward kings with more valid moves
        } else if (board[x][y] === 3) { // Check for opponent kings
          const moves = this.getValidMoves(x, y);
          kingMobilityScore -= moves.length * 2; // Penalize opponent kings with more valid moves
        }
      }
    }
    return kingMobilityScore;
  };

  
  // Function to visually scan tiles
  Board.visualScanTiles = function (tile) {
    const adjacentPositions = [
      [tile.position[0] - 1, tile.position[1] - 1], [tile.position[0] - 1, tile.position[1] + 1],
      [tile.position[0] + 1, tile.position[1] - 1], [tile.position[0] + 1, tile.position[1] + 1]
    ];
  
    for (let [adjX, adjY] of adjacentPositions) {
      if (adjX >= 0 && adjX < 8 && adjY >= 0 && adjY < 8) {
        const adjTile = tiles.find(t => t.position[0] === adjX && t.position[1] === adjY);
        if (adjTile) {
          adjTile.element.addClass('scanning');
        }
      }
    }
  
    setTimeout(() => {
      $('.tile').removeClass('scanning');
    }, 1000); // Remove the scanning effect after 1 second
  };
  
  Board.getAdjacentPieces = function (board, x, y, pieceType) {
    const adjacentPositions = [
      [x - 1, y - 1], [x - 1, y + 1],
      [x + 1, y - 1], [x + 1, y + 1]
    ];
    return adjacentPositions.filter(([adjX, adjY]) => 
      adjX >= 0 && adjX < 8 && adjY >= 0 && adjY < 8 && board[adjX][adjY] === pieceType
    );
  };
  
// Add CSS for scanning effect
const style = document.createElement('style');
style.innerHTML = `
  .tile.scanning {
    background-color: rgba(0, 255, 0, 0.5); /* Green overlay */
    animation: scan 1s infinite;
  }

  @keyframes scan {
    0% { background-color: rgba(0, 255, 0, 0.5); }
    50% { background-color: rgba(0, 255, 0, 0.2); }
    100% { background-color: rgba(0, 255, 0, 0.5); }
  }
`;
document.head.appendChild(style);
};
