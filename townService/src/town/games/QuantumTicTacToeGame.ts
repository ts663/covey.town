import InvalidParametersError, {
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_OVER_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE
} from '../../lib/InvalidParametersError';
import {
  GameMove,
  QuantumTicTacToeGameState,
  QuantumTicTacToeMove,
  TicTacToeMove,
} from '../../types/CoveyTownSocket';
import Game from './Game';
import TicTacToeGame from './TicTacToeGame';
import Player from '../../lib/Player';

/**
 * A QuantumTicTacToeGame is a Game that implements the rules of the Tic-Tac-Toe variant described at https://www.smbc-comics.com/comic/tic.
 * This class acts as a controller for three underlying TicTacToeGame instances, orchestrating the "quantum" rules by taking
 * the role of the monitor.
 */
export default class QuantumTicTacToeGame extends Game<
  QuantumTicTacToeGameState,
  QuantumTicTacToeMove
> {
  private _games: { A: TicTacToeGame; B: TicTacToeGame; C: TicTacToeGame };

  private _xScore: number;

  private _oScore: number;

  private _moveCount: number;

  public constructor() {
    // TODO: implement me
    super({
      moves: [],
      xScore: 0,
      oScore: 0,
      publiclyVisible: { 
        A: [
          [false, false, false],
          [false, false, false],
          [false, false, false],
        ],
        B: [
          [false, false, false],
          [false, false, false],
          [false, false, false],
        ],
        C: [
          [false, false, false],
          [false, false, false],
          [false, false, false],
        ], 
      },
      status: 'WAITING_TO_START',
    });
    this._games = {
      A: new TicTacToeGame(),
      B: new TicTacToeGame(),
      C: new TicTacToeGame()
    };
    this._xScore = this.state.xScore;
    this._oScore = this.state.oScore;
    this._moveCount = this.state.moves.length;
  }

  protected _join(player: Player): void {
    // TODO: implement me
    if (this.state.x === player.id || this.state.o === player.id) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    if (!this.state.x) {
      this.state = {
        ...this.state,
        x: player.id,
      };
    } else if (!this.state.o) {
      this.state = {
        ...this.state,
        o: player.id,
      };
    } else {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }
    if (this.state.x && this.state.o) {
      this.state = {
        ...this.state,
        status: 'IN_PROGRESS',
      };
      this._games.A.state.status = 'IN_PROGRESS';
      this._games.B.state.status = 'IN_PROGRESS';
      this._games.C.state.status = 'IN_PROGRESS';
    }
  }

  protected _leave(player: Player): void {
    // TODO: implement me
    if (this.state.x !== player.id && this.state.o !== player.id) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (this.state.o === undefined) {
      this.state = {
        ...this.state,
        moves: [],
        status: 'WAITING_TO_START',
      };
      return;
    }
    if (this.state.x === player.id) {
      this.state = {
        ...this.state,
        status: 'OVER',
        winner: this.state.o,
      };
    } else {
      this.state = {
        ...this.state,
        status: 'OVER',
        winner: this.state.x,
      };
    }
    Object.keys(this._games).forEach(game => {
      const typedGame = game as keyof { A: TicTacToeGame; B: TicTacToeGame; C: TicTacToeGame };
      this._games[typedGame].state.status = 'OVER';
    });
  }

  /**
   * Checks that the given move is "valid": that the it's the right
   * player's turn, that the game is actually in-progress, etc.
   * @see TicTacToeGame#_validateMove
   */
  private _validateMove(move: GameMove<QuantumTicTacToeMove>): void {
    // TODO: implement me
    for (const m of this.state.moves) {
      if (m.row === move.move.row && m.col === move.move.col && m.board === move.move.board) {
        if (m.gamePiece === move.move.gamePiece) {
          throw new InvalidParametersError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
        }
      }
    }

    if ((move.move.gamePiece === 'X' && this._moveCount % 2 === 1) || (move.move.gamePiece === 'O' && this._moveCount % 2 === 0)) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }

    if (this._games[move.move.board].state.status === 'OVER') {
      throw new InvalidParametersError(GAME_OVER_MESSAGE);
    }

    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
  }

  public applyMove(move: GameMove<QuantumTicTacToeMove>): void {
    this._validateMove(move);

    // TODO: implement the guts of this method

    let gamePiece: 'X' | 'O';
    if (move.playerID === this.state.x) {
      gamePiece = 'X';
    } else {
      gamePiece = 'O';
    }
    let board: 'A' | 'B' | 'C' = move.move.board;

    const cleanMove: QuantumTicTacToeMove = {
      gamePiece,
      row: move.move.row,
      col: move.move.col,
      board,
    };
    const boardMove: TicTacToeMove = {
      gamePiece,
      row: move.move.row,
      col: move.move.col,
    };

    // let currBoard: TicTacToeGame;
    // if (board === 'A') {
    //   currBoard = this._games.A;
    // } else if (board === 'B') {
    //   currBoard = this._games.B;
    // } else {
    //   currBoard = this._games.C;
    // }
    this._moveCount ++;
    const boardMoves: QuantumTicTacToeMove[] = this.state.moves.filter(m => m.board === board);
    if (!boardMoves.find(m => m.row === move.move.row && m.col === move.move.col)) {
      this._games[board].state.moves = [...this._games[board].state.moves, boardMove];
    } else {
      this.state.publiclyVisible[board][move.move.row][move.move.col] = true;
    }
    this.state = {
      ...this.state,
      moves: [...this.state.moves, cleanMove],
    };

    this._checkForWins();
    this._checkForGameEnding();
  }

  /**
   * Checks all three sub-games for any new three-in-a-row conditions.
   * Awards points and marks boards as "won" so they can't be played on.
   */
  private _checkForWins(): void {
    // TODO: implement me
    Object.keys(this._games).forEach(game => {
      const typedGame = game as keyof { A: TicTacToeGame; B: TicTacToeGame; C: TicTacToeGame };
      if (this._games[typedGame].state.status !== 'OVER') {
        if (this._games[typedGame].state.moves.length === 9) {
          this._games[typedGame].state.status = 'OVER';
          this._games[typedGame].state.winner = undefined;
        } else {
          for (let i: number = 0; i < 3; i ++) {
            let col: TicTacToeMove[] = this._games[typedGame].state.moves.filter(move => move.col === i);
            let r0: TicTacToeMove | undefined = col.find(c => c.row === 0);
            let r1: TicTacToeMove | undefined = col.find(c => c.row === 1);
            let r2: TicTacToeMove | undefined = col.find(c => c.row === 2);
            if (r0 !== undefined && r1 !== undefined && r2 !== undefined) {
              if (r0.gamePiece === r1.gamePiece && r0.gamePiece === r2.gamePiece) {
                this._games[typedGame].state.winner = r0.gamePiece === 'X' ? this.state.x : this.state.o;
                if (this._games[typedGame].state.winner === this.state.x) {
                  this.state.xScore ++;
                  this._xScore ++;
                } else {
                  this.state.oScore ++;
                  this._oScore ++;
                }
                this._games[typedGame].state.status = 'OVER';
                break;
              }
            }
            let row: TicTacToeMove[] = this._games[typedGame].state.moves.filter(move => move.row === i);
            let c0: TicTacToeMove | undefined = row.find(r => r.col === 0);
            let c1: TicTacToeMove | undefined = row.find(r => r.col === 1);
            let c2: TicTacToeMove | undefined = row.find(r => r.col === 2);
            if (c0 !== undefined && c1 !== undefined && c2 !== undefined) {
              if (c0.gamePiece === c1.gamePiece && c0.gamePiece === c2.gamePiece) {
                this._games[typedGame].state.winner = c0.gamePiece === 'X' ? this.state.x : this.state.o;
                if (this._games[typedGame].state.winner === this.state.x) {
                  this.state.xScore ++;
                  this._xScore ++;
                } else {
                  this.state.oScore ++;
                  this._oScore ++;
                }
                this._games[typedGame].state.status = 'OVER';
                break;
              }
            }
          }
          let d0: TicTacToeMove[] | undefined = this._games[typedGame].state.moves.filter(d => d.col === 0);
          let d1: TicTacToeMove[] | undefined = this._games[typedGame].state.moves.filter(d => d.col === 1);
          let d2: TicTacToeMove[] | undefined = this._games[typedGame].state.moves.filter(d => d.col === 2);
          if (d0 !== undefined && d1 !== undefined && d2 !== undefined) {
            let d00: TicTacToeMove | undefined = d0.find(d => d.row === 0);
            let d11: TicTacToeMove | undefined = d1.find(d => d.row === 1);
            let d22: TicTacToeMove | undefined = d2.find(d => d.row === 2);
            if (d00 !== undefined && d11 !== undefined && d22 !== undefined) {
              if (d00.gamePiece === d11.gamePiece && d00.gamePiece === d22.gamePiece) {
                this._games[typedGame].state.winner = d00.gamePiece === 'X' ? this.state.x : this.state.o;
                if (this._games[typedGame].state.winner === this.state.x) {
                  this.state.xScore ++;
                  this._xScore ++;
                } else {
                  this.state.oScore ++;
                  this._oScore ++;
                }
                this._games[typedGame].state.status = 'OVER';
              }
            } else {
              let d02: TicTacToeMove | undefined = d0.find(d => d.row === 2);
              let d20: TicTacToeMove | undefined = d2.find(d => d.row === 0);
              if (d02 !== undefined && d11 !== undefined && d20 !== undefined) {
                if (d02.gamePiece === d11.gamePiece && d02.gamePiece === d20.gamePiece) {
                  this._games[typedGame].state.winner = d02.gamePiece === 'X' ? this.state.x : this.state.o;
                  if (this._games[typedGame].state.winner === this.state.x) {
                    this.state.xScore ++;
                    this._xScore ++;
                  } else {
                    this.state.oScore ++;
                    this._oScore ++;
                  }
                  this._games[typedGame].state.status = 'OVER';
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * A Quantum Tic-Tac-Toe game ends when no more moves are possible.
   * This happens when all squares on all boards are either occupied or part of a won board.
   */
  private _checkForGameEnding(): void {
    // TODO: implement me
    if (this._games.A.state.status === 'OVER' && this._games.B.state.status === 'OVER' && this._games.C.state.status === 'OVER') {
      this.state.status = 'OVER';
    }
    if (this._xScore > this._oScore) {
      this.state.winner = this.state.x;
    } else if (this._xScore < this._oScore) {
      this.state.winner = this.state.o;
    } else {
      this.state.winner = undefined;
    }
  }
}
