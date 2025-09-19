import { createPlayerForTesting } from '../../TestUtils';
import { GAME_NOT_IN_PROGRESS_MESSAGE, MOVE_NOT_YOUR_TURN_MESSAGE, PLAYER_NOT_IN_GAME_MESSAGE } from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { GameMove, QuantumTicTacToeMove } from '../../types/CoveyTownSocket';
import QuantumTicTacToeGame from './QuantumTicTacToeGame';

describe('QuantumTicTacToeGame', () => {
  let game: QuantumTicTacToeGame;
  let player1: Player;
  let player2: Player;

  beforeEach(() => {
    game = new QuantumTicTacToeGame();
    player1 = createPlayerForTesting();
    player2 = createPlayerForTesting();
  });

  describe('_join', () => {
    it('should add the first player as X', () => {
      game.join(player1);
      expect(game.state.x).toBe(player1.id);
      expect(game.state.o).toBeUndefined();
      expect(game.state.status).toBe('WAITING_TO_START');
    });

    it('should add the second player as O', () => {
      game.join(player1);
      game.join(player2);
      expect(game.state.x).toBe(player1.id);
      expect(game.state.o).toBe(player2.id);
      expect(game.state.status).toBe('IN_PROGRESS');
    });

    it('should set game status to IN_PROGRESS and the status of boards A-C to IN_PROGRESS', () => {
      game.join(player1);
      game.join(player2);
      expect(game.state.status).toBe('IN_PROGRESS');
      // @ts-expect-error - private property
      expect(game._games.A.state.status).toBe('IN_PROGRESS');
      // @ts-expect-error - private property
      expect(game._games.B.state.status).toBe('IN_PROGRESS');
      // @ts-expect-error - private property
      expect(game._games.C.state.status).toBe("IN_PROGRESS");
    });
  });

  describe('_leave', () => {
    describe('when no players are in the game', () => {
      it('should throw error if player tries to leave game', () => {
        expect(() => game.leave(player1)).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
      });
    });

    describe('when two players are in the game', () => {
      beforeEach(() => {
        game.join(player1);
        game.join(player2);
      });

      it('should set the game to OVER and declare the other player the winner', () => {
        game.leave(player1);
        expect(game.state.status).toBe('OVER');
        // @ts-expect-error - private property
        expect(game._games.A.state.status).toBe('OVER');
        // @ts-expect-error - private property
        expect(game._games.B.state.status).toBe('OVER');
        // @ts-expect-error - private property
        expect(game._games.C.state.status).toBe('OVER');
        expect(game.state.winner).toBe(player2.id);
      });

      it('should set the game to OVER and declare the other player the winner', () => {
        game.leave(player2);
        expect(game.state.status).toBe('OVER');
        // @ts-expect-error - private property
        expect(game._games.A.state.status).toBe('OVER');
        // @ts-expect-error - private property
        expect(game._games.B.state.status).toBe('OVER');
        // @ts-expect-error - private property
        expect(game._games.C.state.status).toBe('OVER');
        expect(game.state.winner).toBe(player1.id);
      });
    });
  });

  describe('applyMove', () => {
    describe('if the game is not in progress', () => {
      const makeMove = (player: Player, board: 'A' | 'B' | 'C', row: 0 | 1 | 2, col: 0 | 1 | 2) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const move: GameMove<QuantumTicTacToeMove> = {
          playerID: player.id,
          gameID: game.id,
          move: { board, row, col, gamePiece: 'X' },
        };
        // @ts-expect-error - private property
        expect(() => game._validateMove(move)).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      };
      it('should throw error if no players are in the game', () => {
        makeMove(player1, 'A', 0, 0);
      });
      it('should throw error if only one player is in the game', () => {
        game.join(player1);
        makeMove(player1, 'A', 0, 0);
      });
    });

    describe('if the game is in progress', () => {
      beforeEach(() => {
        game.join(player1);
        game.join(player2);
      });

      const makeMove = (player: Player, board: 'A' | 'B' | 'C', row: 0 | 1 | 2, col: 0 | 1 | 2) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const move: GameMove<any> = {
          playerID: player.id,
          gameID: game.id,
          move: { board, row, col },
        };
        game.applyMove(move);
      };

      it('should place a piece on an empty square', () => {
        makeMove(player1, 'A', 0, 0);
        // @ts-expect-error - private property
        expect(game._games.A._board[0][0]).toBe('X');
        expect(game.state.moves.length).toBe(1);
      });
      
      it('should place a piece on an empty square', () => {
        makeMove(player1, 'B', 0, 0);
        // @ts-expect-error - private property
        expect(game._games.B._board[0][0]).toBe('X');
        expect(game.state.moves.length).toBe(1);
      });

      it('should place a piece on an empty square', () => {
        makeMove(player1, 'C', 0, 0);
        // @ts-expect-error - private property
        expect(game._games.C._board[0][0]).toBe('X');
        expect(game.state.moves.length).toBe(1);
      });

      it('should set the corresponding square on the public board to true if piece is already present', () => {
        makeMove(player1, 'A', 0, 0);
        makeMove(player2, 'A', 0, 0);
        expect(game.state.publiclyVisible.A[0][0]).toBe(true);
        expect(game.state.moves.length).toBe(2);
      });

      it('should cause the other player to lose their turn if the opponent already placed a piece on the square', () => {
        makeMove(player1, 'A', 0, 0);
        makeMove(player2, 'A', 0, 0);
        const makeMove2 = (player: Player, board: 'A' | 'B' | 'C', row: 0 | 1 | 2, col: 0 | 1 | 2) => {
          const move: GameMove<QuantumTicTacToeMove> = {
            playerID: player.id,
            gameID: game.id,
            move: { board, row, col, gamePiece: 'O' },
          };
          // @ts-expect-error - private property
          expect(() => game._validateMove(move)).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
        };
        makeMove2(player2, 'A', 0, 1);
      });

      it('should prevent the same player from playing twice in a row', () => {
        const makeMove2 = (player: Player, board: 'A' | 'B' | 'C', row: 0 | 1 | 2, col: 0 | 1 | 2) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const move: GameMove<QuantumTicTacToeMove> = {
            playerID: player.id,
            gameID: game.id,
            move: { board, row, col, gamePiece: 'X' },
          };
          // @ts-expect-error - private property
          expect(() => game._validateMove(move)).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
        };
        makeMove(player1, 'A', 0, 0);
        makeMove2(player1, 'A', 0, 1);
      });
    
      describe('scoring and game end', () => {
        it('should award a point when a player gets three-in-a-row', () => {
          // X gets a win on board A
          makeMove(player1, 'A', 0, 0); // X
          makeMove(player2, 'B', 0, 0); // O
          makeMove(player1, 'A', 0, 1); // X
          makeMove(player2, 'B', 0, 1); // O
          makeMove(player1, 'A', 0, 2); // X -> scores 1 point

          expect(game.state.xScore).toBe(1);
          expect(game.state.oScore).toBe(0);
          // @ts-expect-error - private property
          expect(game._games.A.state.status).toBe('OVER');
          // @ts-expect-error - private property
          expect(game._games.A.state.winner).toBe(player1.id);
          // @ts-expect-error - private property
          expect(game._games.B.state.status).toBe('IN_PROGRESS');
          // @ts-expect-error - private property
          expect(game._games.C.state.status).toBe('IN_PROGRESS');
          expect(game.state.status).toBe('IN_PROGRESS');
        });

        it('should set the game state to over and winner based on whose score is larger', () => {
          makeMove(player1, 'A', 0, 0);
          makeMove(player2, 'B', 0, 0);
          makeMove(player1, 'A', 0, 1);
          makeMove(player2, 'B', 0, 1);
          makeMove(player1, 'A', 0, 2);
          makeMove(player2, 'B', 0, 2);
          makeMove(player1, 'C', 0, 0);
          makeMove(player2, 'C', 2, 0);
          makeMove(player1, 'C', 0, 1);
          makeMove(player2, 'C', 2, 1);
          makeMove(player1, 'C', 0, 2);
          expect(game.state.status).toBe('OVER');
          expect(game.state.winner).toBe(game.state.x);
          expect(game.state.xScore).toBe(2);
          // @ts-expect-error - private property
          expect(game._xScore).toBe(2);
          expect(game.state.oScore).toBe(1);
          // @ts-expect-error - private property
          expect(game._oScore).toBe(1);
          // @ts-expect-error - private property
          expect(game._games.A.state.status).toBe('OVER');
          // @ts-expect-error - private property
          expect(game._games.A.state.winner).toBe(game.state.x);
          // @ts-expect-error - private property
          expect(game._games.B.state.status).toBe('OVER');
          // @ts-expect-error - private property
          expect(game._games.B.state.winner).toBe(game.state.o);
          // @ts-expect-error - private property
          expect(game._games.C.state.status).toBe('OVER');
          // @ts-expect-error - private property
          expect(game._games.C.state.winner).toBe(game.state.x);
        });
        it('should set the game state to over and winner to undefined if scores are equal', () => {
          makeMove(player1, 'A', 0, 0);
          makeMove(player2, 'B', 0, 0);
          makeMove(player1, 'A', 0, 1);
          makeMove(player2, 'B', 0, 1);
          makeMove(player1, 'A', 0, 2);
          makeMove(player2, 'B', 0, 2);
          makeMove(player1, 'C', 0, 0);
          makeMove(player2, 'C', 0, 1);
          makeMove(player1, 'C', 0, 2);
          makeMove(player2, 'C', 1, 2);
          makeMove(player1, 'C', 1, 0);
          makeMove(player2, 'C', 2, 0);
          makeMove(player1, 'C', 1, 1);
          makeMove(player2, 'C', 2, 2);
          makeMove(player1, 'C', 2, 1);
          expect(game.state.status).toBe('OVER');
          expect(game.state.winner).toBe(undefined);
          expect(game.state.xScore).toBe(1);
          // @ts-expect-error - private property
          expect(game._xScore).toBe(1);
          expect(game.state.oScore).toBe(1);
          // @ts-expect-error - private property
          expect(game._oScore).toBe(1);
          // @ts-expect-error - private property
          expect(game._games.A.state.status).toBe('OVER');
          // @ts-expect-error - private property
          expect(game._games.A.state.winner).toBe(game.state.x);
          // @ts-expect-error - private property
          expect(game._games.B.state.status).toBe('OVER');
          // @ts-expect-error - private property
          expect(game._games.B.state.winner).toBe(game.state.o);
          // @ts-expect-error - private property
          expect(game._games.C.state.status).toBe('OVER');
          // @ts-expect-error - private property
          expect(game._games.C.state.winner).toBe(undefined);
        });
      });
    });
  });
});
