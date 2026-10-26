import { prisma } from '../prisma.js';
import { scoringService } from './scoringService.js';
import { RoundStatus, SubmissionStatus } from '@prisma/client';
import { teamRoundProgressService } from './teamRoundProgressService.js';

export class Round2Service {
  /**
   * Get active Round 2 data, initial Sudoku grid, and unlocked stage data for the team.
   * If Round 2 is UPCOMING, no puzzles are exposed.
   */
  public async getRound2Data(teamId: string) {
    const roundControl = await prisma.roundControl.findUnique({ where: { id: 2 } });
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    const progress = await teamRoundProgressService.enterRound2(teamId);
    const timer = teamRoundProgressService.timer(progress, roundControl?.status);

    const isRoundUnlocked = !!progress && ['IN_PROGRESS', 'COMPLETED'].includes(progress.status);

    if (!isRoundUnlocked) {
      return {
        round: roundControl,
        timer,
        serverTime: new Date().toISOString(),
        currentStage: 1,
        isUnlocked: false,
        message: progress?.status === 'TIMED_OUT'
          ? 'Round 2 timed out. Round 3 is now unlocked.'
          : 'Round 2 — Complete Round 1 and wait for officials to open the round.',
        sudoku: null,
        brokenLogic: {
          puzzle: null,
          isUnlocked: false,
          isCompleted: false
        }
      };
    }

    const sudoku = await prisma.sudokuPuzzle.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        round: true,
        initialGrid: true
      }
    });

    const isSudokuCompleted = await prisma.scoreEvent.findUnique({
      where: {
        teamId_source: {
          teamId,
          source: 'ROUND2_STAGE1_SUDOKU'
        }
      }
    });

    let brokenLogic = null;
    let isBrokenLogicCompleted = false;

    if (isSudokuCompleted) {
      const bl = await prisma.brokenLogicPuzzle.findFirst({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          scenario: true,
          codeSnippet: true,
          points: true
        }
      });
      brokenLogic = bl;

      const blScore = await prisma.scoreEvent.findUnique({
        where: {
          teamId_source: {
            teamId,
            source: 'ROUND2_STAGE2_BROKEN_LOGIC'
          }
        }
      });
      isBrokenLogicCompleted = !!blScore;
    }

    return {
      round: roundControl,
      timer,
      serverTime: new Date().toISOString(),
      currentStage: team?.currentStage || (isSudokuCompleted ? 2 : 1),
      isUnlocked: true,
      sudoku: {
        ...sudoku,
        isCompleted: !!isSudokuCompleted
      },
      brokenLogic: {
        puzzle: brokenLogic,
        isUnlocked: !!isSudokuCompleted,
        isCompleted: isBrokenLogicCompleted
      }
    };
  }

  /**
   * Validate submitted Sudoku grid.
   */
  public async submitSudoku(params: {
    teamId: string;
    submittedGrid: string;
    usedHint?: boolean;
    clientIp?: string;
  }) {
    const roundControl = await prisma.roundControl.findUnique({ where: { id: 2 } });
    if (!roundControl) {
      return { success: false, error: 'ROUND_NOT_FOUND', message: 'Round 2 control not found.' };
    }

    if (roundControl.status === RoundStatus.PAUSED) {
      return {
        success: false,
        error: 'ROUND_PAUSED',
        message: 'Round 2 is currently paused by tournament officials.'
      };
    }

    if (roundControl.status !== RoundStatus.ACTIVE) {
      return {
        success: false,
        error: 'ROUND_INACTIVE',
        message: 'Round 2 is not currently active.'
      };
    }

    const existing = await prisma.scoreEvent.findUnique({
      where: {
        teamId_source: {
          teamId: params.teamId,
          source: 'ROUND2_STAGE1_SUDOKU'
        }
      }
    });

    if (existing) {
      return {
        success: true,
        alreadySubmitted: true,
        isCorrect: true,
        pointsAwarded: 0,
        message: 'Shape Sudoku has already been completed by your team.'
      };
    }

    const progress = await teamRoundProgressService.getTeamRound(params.teamId, 2);
    if (!progress || progress.status !== 'IN_PROGRESS' || !progress.deadlineAt || progress.deadlineAt <= new Date()) return { success: false, error: progress?.status === 'TIMED_OUT' ? 'ROUND_EXPIRED' : 'ROUND_INACTIVE', message: 'Your team Round 2 timer is not active.' };

    const puzzle = await prisma.sudokuPuzzle.findFirst({ where: { isActive: true } });
    if (!puzzle) {
      return { success: false, error: 'NO_PUZZLE', message: 'No active Sudoku puzzle found.' };
    }

    const normalizedSubmitted = params.submittedGrid.trim().toUpperCase();

    // Verify against authoritative solution
    const isExactMatch = normalizedSubmitted === puzzle.solutionGrid.toUpperCase();

    // Mathematically verify row, column, and 2x3 box uniqueness as an extra check
    const validSymbols = new Set(['S', 'T', 'C', 'U', 'A', 'D']);
    let isMathValid = normalizedSubmitted.length === 36;
    if (isMathValid) {
      for (let r = 0; r < 6; r++) {
        const rowSet = new Set<string>();
        const colSet = new Set<string>();
        for (let c = 0; c < 6; c++) {
          const rowChar = normalizedSubmitted[r * 6 + c];
          const colChar = normalizedSubmitted[c * 6 + r];
          if (!validSymbols.has(rowChar) || !validSymbols.has(colChar)) isMathValid = false;
          rowSet.add(rowChar);
          colSet.add(colChar);
        }
        if (rowSet.size !== 6 || colSet.size !== 6) isMathValid = false;
      }
      for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 2; bc++) {
          const boxSet = new Set<string>();
          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 3; c++) {
              boxSet.add(normalizedSubmitted[(br * 2 + r) * 6 + (bc * 3 + c)]);
            }
          }
          if (boxSet.size !== 6) isMathValid = false;
        }
      }
    }

    const isValid = isExactMatch && isMathValid;

    if (!isValid) {
      await prisma.submission.create({
        data: {
          teamId: params.teamId,
          round: 2,
          stage: 1,
          submittedValue: normalizedSubmitted,
          status: SubmissionStatus.INCORRECT,
          pointsAwarded: 0,
          clientIp: params.clientIp
        }
      });

      return {
        success: false,
        isCorrect: false,
        error: 'INVALID_SUDOKU',
        message: 'That Sudoku submission is not correct. Check the grid and try again.'
      };
    }

    const basePoints = 100;
    const points = basePoints;

    await prisma.submission.create({
      data: {
        teamId: params.teamId,
        round: 2,
        stage: 1,
        submittedValue: normalizedSubmitted,
        status: SubmissionStatus.CORRECT,
        pointsAwarded: points,
        clientIp: params.clientIp
      }
    });

    const awardRes = await scoringService.awardScore({
      teamId: params.teamId,
      round: 2,
      stage: 1,
      source: 'ROUND2_STAGE1_SUDOKU',
      pointsDelta: points,
      reason: 'Round 2 Shape Sudoku solved'
    });

    await prisma.team.update({
      where: { id: params.teamId },
      data: {
        currentRound: 2,
        currentStage: 2
      }
    });

    return {
      success: true,
      isCorrect: true,
      stageUnlocked: 2,
      pointsAwarded: points,
      message: `Shape Sudoku verified! Stage 2: Broken Logic is now unlocked. (+${points} pts)`,
      newTotalScore: awardRes.newTotalScore
    };
  }

  /**
   * Validate Broken Logic submission.
   */
  public async submitBrokenLogic(params: {
    teamId: string;
    submittedOutput: string;
    clientIp?: string;
  }) {
    const roundControl = await prisma.roundControl.findUnique({ where: { id: 2 } });
    if (!roundControl) {
      return { success: false, error: 'ROUND_NOT_FOUND', message: 'Round 2 control not found.' };
    }

    if (roundControl.status === RoundStatus.PAUSED) {
      return {
        success: false,
        error: 'ROUND_PAUSED',
        message: 'Round 2 is currently paused by tournament officials.'
      };
    }

    if (roundControl.status !== RoundStatus.ACTIVE) {
      return {
        success: false,
        error: 'ROUND_INACTIVE',
        message: 'Round 2 is not currently active.'
      };
    }

    const existing = await prisma.scoreEvent.findUnique({ where: { teamId_source: { teamId: params.teamId, source: 'ROUND2_STAGE2_BROKEN_LOGIC' } } });
    if (existing) return { success: true, alreadySubmitted: true, isCorrect: true, pointsAwarded: 0, message: 'Broken Logic challenge has already been solved by your team.' };

    const progress = await teamRoundProgressService.getTeamRound(params.teamId, 2);
    if (!progress || progress.status !== 'IN_PROGRESS' || !progress.deadlineAt || progress.deadlineAt <= new Date()) return { success: false, error: progress?.status === 'TIMED_OUT' ? 'ROUND_EXPIRED' : 'ROUND_INACTIVE', message: 'Your team Round 2 timer is not active.' };

    // Stage Order Enforcement: Check if Sudoku was solved first!
    const sudokuCompleted = await prisma.scoreEvent.findUnique({
      where: {
        teamId_source: {
          teamId: params.teamId,
          source: 'ROUND2_STAGE1_SUDOKU'
        }
      }
    });

    if (!sudokuCompleted) {
      return {
        success: false,
        error: 'STAGE_LOCKED',
        message: 'Stage 2 is locked. You must successfully solve Shape Sudoku first.'
      };
    }

    const puzzle = await prisma.brokenLogicPuzzle.findFirst({ where: { isActive: true } });
    if (!puzzle) {
      return { success: false, error: 'NO_PUZZLE', message: 'No active Broken Logic puzzle found.' };
    }

    const normalizedSubmitted = params.submittedOutput.trim();
    const isCorrect = normalizedSubmitted === puzzle.expectedOutput.trim();

    if (!isCorrect) {
      await prisma.submission.create({
        data: {
          teamId: params.teamId,
          round: 2,
          stage: 2,
          submittedValue: normalizedSubmitted,
          status: SubmissionStatus.INCORRECT,
          pointsAwarded: 0,
          clientIp: params.clientIp
        }
      });

      return {
        success: false,
        isCorrect: false,
        error: 'INCORRECT_LOGIC_OUTPUT',
        message: 'The submitted output value is incorrect. Review operator precedence and conditions.'
      };
    }

    await prisma.submission.create({
      data: {
        teamId: params.teamId,
        round: 2,
        stage: 2,
        submittedValue: normalizedSubmitted,
        status: SubmissionStatus.CORRECT,
        pointsAwarded: puzzle.points,
        clientIp: params.clientIp
      }
    });

    const awardRes = await scoringService.awardScore({
      teamId: params.teamId,
      round: 2,
      stage: 2,
      source: 'ROUND2_STAGE2_BROKEN_LOGIC',
      pointsDelta: puzzle.points,
      reason: 'Round 2 Broken Logic challenge solved successfully'
    });

    await prisma.team.update({
      where: { id: params.teamId },
      data: {
        currentRound: 3,
        currentStage: 1
      }
    });
    await teamRoundProgressService.completeRound(params.teamId, 2);

    return {
      success: true,
      isCorrect: true,
      pointsAwarded: puzzle.points,
      message: `Protocol Breach Stage Cleared! +${puzzle.points} points awarded. Round 3 Unlocked.`,
      newTotalScore: awardRes.newTotalScore
    };
  }
}

export const round2Service = new Round2Service();
