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

  // Function to update move history
  function updateMoveHistory(move, isAI = false) {
    moveHistory.push(move);
    moveList.push({ san: move }); // Store move in SAN format
    const color = isAI ? '#085c9c' : 'black';
    const playerTag = isAI ? '<span style="color: #085c9c;">AI:</span> ' : '<span style="color: black;">Player:</span> ';
    $('#moveHistory').append("<div>" + playerTag + move + "</div>"); // Assuming you have a div with id 'moveHistory'
    // Scroll to the bottom of the move history
    $('#moveHistory').scrollTop($('#moveHistory')[0].scrollHeight);
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
      // Notify that the piece has been crowned
      console.log("Player " + this.player + "'s piece has been crowned a king!");
      // Comment indicating the piece reached the opposite side
      console.log("Piece reached the opposite side and became a king!");
      // Update move history with the king message
      updateMoveHistory("Player " + this.player + "'s piece has been crowned a king!");
    }

    this.move = function (tile) {
      this.element.removeClass('selected');
      if (!Board.isValidPlacetoMove(tile.position[0], tile.position[1])) return false;

      // Ensure piece doesn't move backwards if not a king
      if ((this.player == 1 && !this.king && tile.position[0] < this.position[0]) ||
          (this.player == 2 && !this.king && tile.position[0] > this.position[0])) {
        return false;
      }

      // Remove the mark from Board.board and put it in the new spot
      Board.board[this.position[0]][this.position[1]] = 0;
      Board.board[tile.position[0]][tile.position[1]] = this.player;
      this.position = [tile.position[0], tile.position[1]];
      this.element.css('top', Board.dictionary[this.position[0]]);
      this.element.css('left', Board.dictionary[this.position[1]]);
      
      // Crown the piece if it reaches the opposite side
      if (!this.king && (this.position[0] == 0 || this.position[0] == 7)) {
        this.makeKing();
      }
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
              // Notify that a piece has been captured
              console.log("Player " + pieces[pieceIndex].player + "'s piece has been captured!");
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
        return true;
      }
      return false;
    };

    this.continueJump = function () {
      if (this.canJumpAny()) {
        Board.continuousjump = true;
        this.element.addClass('selected');
      } else {
        Board.continuousjump = false;
        Board.changePlayerTurn();
      }
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
    },

    tileRender: function (row, column, countTiles) {
      this.tilesElement.append("<div class='tile' id='tile" + countTiles + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
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
      $('.turn').css("background", this.playerTurn == 1 ? "linear-gradient(to right, #BEEE62 50%, transparent 50%)" : "linear-gradient(to right, transparent 50%, #BEEE62 50%)");
      this.check_if_jump_exist();

      if (this.playerTurn === 2) {
        setTimeout(aiMove, 1000); // Delay AI move for better UX
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
        updateMoveHistory("AI wins!");
        this.showNewGameButton();
      } else if (this.isDraw()) {
        // Record the draw in move history
        updateMoveHistory("1/2 - 1/2");
        this.showNewGameButton();
      }
    },

    showNewGameButton: function() {
      $('#newGameBtn').show(); // Show the new game button
    },

    // Reset the game
    clear: function () {
      location.reload();
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

    isDraw: function() {
      // Implement draw condition logic here
      // For simplicity, let's assume a draw if no player can move
      for (let piece of pieces) {
        if (piece.player === this.playerTurn && piece.allowedtomove) {
          return false;
        }
      }
      return true;
    }
  }

  // Function to get a random integer
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  // Minimax algorithm with alpha-beta pruning
  function minimax(board, depth, isMaximizingPlayer, alpha, beta) {
    if (depth === 0 || Board.checkForWin()) {
      return evaluateBoard(board);
    }

    if (isMaximizingPlayer) {
      let maxEval = -Infinity;
      for (let move of getAllPossibleMoves(board, 2)) {
        let eval = minimax(move.board, depth - 1, false, alpha, beta);
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, eval);
        if (beta <= alpha) {
          break;
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let move of getAllPossibleMoves(board, 1)) {
        let eval = minimax(move.board, depth - 1, true, alpha, beta);
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, eval);
        if (beta <= alpha) {
          break;
        }
      }
      return minEval;
    }
  }

  // Evaluate the board state
  function evaluateBoard(board) {
    let score = 0;
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col] === 1) {
          score -= 1;
          if (isPieceSafe(board, row, col, 1)) {
            score -= 0.5; // Penalize if the piece is not safe
          }
        } else if (board[row][col] === 2) {
          score += 1;
          if (isPieceSafe(board, row, col, 2)) {
            score += 0.5; // Reward if the piece is safe
          }
        }
      }
    }
    return score;
  }

  // Check if a piece is safe
  function isPieceSafe(board, row, col, player) {
    const opponent = player === 1 ? 2 : 1;
    const directions = [
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];
    for (let [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;
      const jumpRow = row + 2 * dx;
      const jumpCol = col + 2 * dy;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 &&
          jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8) {
        if (board[newRow][newCol] === opponent && board[jumpRow][jumpCol] === 0) {
          return false; // The piece is not safe
        }
      }
    }
    return true; // The piece is safe
  }

  // Get all possible moves for a player
  function getAllPossibleMoves(board, player) {
    let moves = [];
    for (let piece of pieces) {
      if (piece.player === player) {
        for (let tile of tiles) {
          let inRange = tile.inRange(piece);
          if (inRange === 'regular' || (inRange === 'jump' && piece.canOpponentJump(tile.position))) {
            let newBoard = JSON.parse(JSON.stringify(board));
            newBoard[piece.position[0]][piece.position[1]] = 0;
            newBoard[tile.position[0]][tile.position[1]] = player;
            moves.push({ board: newBoard, piece, tile, inRange });
          }
        }
      }
    }
    return moves;
  }

  // Function for AI move
  function aiMove() {
    let bestMove = null;
    let bestValue = -Infinity;
    let jumpMoves = [];
    let regularMoves = [];
  
    // Separate jump moves and regular moves
    for (let move of getAllPossibleMoves(Board.board, 2)) {
      if (move.inRange === 'jump') {
        jumpMoves.push(move);
      } else {
        regularMoves.push(move);
      }
    }
  
    // Prioritize jump moves
    let movesToConsider = jumpMoves.length > 0 ? jumpMoves : regularMoves;
  
    for (let move of movesToConsider) {
      let boardCopy = JSON.parse(JSON.stringify(Board.board));
      boardCopy[move.piece.position[0]][move.piece.position[1]] = 0;
      boardCopy[move.tile.position[0]][move.tile.position[1]] = 2;
      let moveValue = minimax(boardCopy, 5, false, -Infinity, Infinity); // Adjusted depth to 5 for performance
      if (moveValue > bestValue) {
        bestValue = moveValue = moveValue;
        bestMove = move;
      }
    }
  
    if (bestMove) {
      let fromPosition = bestMove.piece.position;
      let toPosition = bestMove.tile.position;
      if (bestMove.inRange === 'jump') {
        bestMove.piece.opponentJump(bestMove.tile);
      }
      bestMove.piece.move(bestMove.tile);
      updateMoveHistory(`E${fromPosition[0]}${fromPosition[1]} ${bestMove.inRange === 'jump' ? 'X' : '-'} E${toPosition[0]}${toPosition[1]}`, true);
  
      // Check for additional jumps
      if (bestMove.inRange === 'jump' && bestMove.piece.canJumpAny()) {
        setTimeout(aiMove, 1000); // Continue AI move after a delay
      } else {
        Board.changePlayerTurn();
      }
    }
  }
  
  // Enhanced evaluation function
  function evaluateBoard(board) {
    let score = 0;
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col] === 1) {
          score -= 1;
          if (isPieceSafe(board, row, col, 1)) {
            score -= 0.5; // Penalize if the piece is not safe
          }
          if (isPieceKing(board, row, col, 1)) {
            score -= 2; // Penalize more if the piece is a king
          }
        } else if (board[row][col] === 2) {
          score += 1;
          if (isPieceSafe(board, row, col, 2)) {
            score += 0.5; // Reward if the piece is safe
          }
          if (isPieceKing(board, row, col, 2)) {
            score += 2; // Reward more if the piece is a king
          }
        }
      }
    }
    // Additional factors for evaluation
    score += controlCenter(board, 2) - controlCenter(board, 1); // Control of the center
    score += potentialMoves(board, 2) - potentialMoves(board, 1); // Potential future moves
    return score;
  }
  
  // Check if a piece is a king
  function isPieceKing(board, row, col, player) {
    return (player === 1 && row === 0) || (player === 2 && row === 7);
  }
  
  // Check control of the center
  function controlCenter(board, player) {
    let centerControl = 0;
    const centerPositions = [
      [3, 3], [3, 4], [4, 3], [4, 4]
    ];
    for (let [row, col] of centerPositions) {
      if (board[row][col] === player) {
        centerControl += 1;
      }
    }
    return centerControl;
  }
  
  // Check potential future moves
  function potentialMoves(board, player) {
    let moves = 0;
    for (let piece of pieces) {
      if (piece.player === player) {
        for (let tile of tiles) {
          let inRange = tile.inRange(piece);
          if (inRange === 'regular' || (inRange === 'jump' && piece.canOpponentJump(tile.position))) {
            moves += 1;
          }
        }
      }
    }
    return moves;
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
    if (isPlayersTurn) {
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
  
  // Reset game when clear button is pressed
  $('#cleargame').on("click", function () {
    Board.clear();
  });
  
  // Move piece when tile is clicked
  $('.tile').on("click", function () {
    if ($('.selected').length != 0) {
      var tileID = $(this).attr("id").replace(/tile/, '');
      var tile = tiles[tileID];
      var piece = pieces[$('.selected').attr("id")];
      var inRange = tile.inRange(piece);
      if (inRange != 'wrong') {
        if (inRange == 'jump') {
          if (piece.opponentJump(tile)) {
            var lastTile = $('.selected').attr("id"); // Get the last tile the piece was on
            piece.move(tile);
            var opponentTile = tile.position; // Get the position of the opponent's tile
            updateMoveHistory("E" + lastTile + " X E" + tileID); // Update move history with consistent format
            piece.continueJump(); // Check for additional jumps
          }
        } else if (inRange == 'regular' && !Board.jumpexist) {
          if (!piece.canJumpAny()) {
            var lastTile = $('.selected').attr("id"); // Get the last tile the piece was on
            piece.move(tile);
            updateMoveHistory("E" + lastTile + " - E" + tileID); // Update move history with consistent format
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
  
  // New Game button functionality
  $('#newGameBtn').on('click', function() {
    location.reload(); // Reload the page to start a new game
  });
}
