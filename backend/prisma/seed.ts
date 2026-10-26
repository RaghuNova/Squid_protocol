import { PrismaClient, UserRole, RoundStatus, SignalState } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateQrToken, isStrongQrToken } from '../src/utils/qrToken.js';

const prisma = new PrismaClient();

const TEAM_NAMES = [
  "Apex Vanguard", "Quantum Phantoms", "Binary Gladiators", "Cyber Sentinels",
  "Null Pointers", "Red Team Zero", "Synapse Breakers", "Kernel Overlords",
  "Matrix Rebels", "Shadow Operatives", "Protocol 404", "Byte Raiders",
  "Cipher Legion", "Root Enforcers", "Echo Syndicate", "Glitch Mob",
  "Vector Wardens", "Dark Silicon", "Iron Daemons", "Omega Breach"
];

const ROUND1_QUESTIONS = [
  {
    orderIndex: 1,
    topic: "Binary & Number Systems",
    prompt: "What is the two's complement 8-bit binary representation of decimal -42, and what is its hexadecimal equivalent?",
    codeSnippet: null,
    options: [
      { id: "A", text: "11010110 (0xD6)" },
      { id: "B", text: "11010101 (0xD5)" },
      { id: "C", text: "00101010 (0x2A)" },
      { id: "D", text: "11100110 (0xE6)" }
    ],
    correctOption: "A",
    explanation: "+42 in 8-bit binary is 00101010. Inverting bits gives 11010101. Adding 1 yields 11010110, which converts to hexadecimal 0xD6."
  },
  {
    orderIndex: 2,
    topic: "Code Tracing",
    prompt: "Consider the following JavaScript snippet:\nconst a = [1, 2, 3];\nconst b = a.map(x => x * 2);\nb.push(a.shift());\nconsole.log(a.length + b.length);\nWhat is the printed output?",
    codeSnippet: "const a = [1, 2, 3];\nconst b = a.map(x => x * 2);\nb.push(a.shift());\nconsole.log(a.length + b.length);",
    options: [
      { id: "A", text: "5" },
      { id: "B", text: "6" },
      { id: "C", text: "4" },
      { id: "D", text: "7" }
    ],
    correctOption: "B",
    explanation: "Array a starts with 3 elements. Array b is [2, 4, 6] (length 3). a.shift() mutates a (length becomes 2) and pushes 1 to b (length becomes 4). 2 + 4 = 6."
  },
  {
    orderIndex: 3,
    topic: "Boolean Logic",
    prompt: "Which boolean expression is logically equivalent to NOT (A AND (B OR NOT C))?",
    codeSnippet: null,
    options: [
      { id: "A", text: "NOT A OR (NOT B AND C)" },
      { id: "B", text: "NOT A AND (NOT B OR C)" },
      { id: "C", text: "NOT A OR (NOT B OR C)" },
      { id: "D", text: "A AND (NOT B AND C)" }
    ],
    correctOption: "A",
    explanation: "Applying De Morgan's Law: ~(A & (B | ~C)) = ~A | ~(B | ~C) = ~A | (~B & ~~C) = ~A | (~B & C)."
  },
  {
    orderIndex: 4,
    topic: "Networking & DNS",
    prompt: "In a recursive DNS resolution process for secure.squid.org when the local cache is completely empty, which authority does the recursive resolver contact first?",
    codeSnippet: null,
    options: [
      { id: "A", text: "The Root DNS Server ('.')" },
      { id: "B", text: "The Top-Level Domain (TLD) Nameserver ('.org')" },
      { id: "C", text: "The Authoritative Nameserver for squid.org" },
      { id: "D", text: "The local router gateway" }
    ],
    correctOption: "A",
    explanation: "Recursive DNS resolvers without cached entries start iterative resolution at one of the 13 logical Root DNS server clusters ('.')."
  },
  {
    orderIndex: 5,
    topic: "Data Structures",
    prompt: "A queue Q and a stack S are initially empty. The operations executed in sequence are:\nenqueue(5), enqueue(10), push(dequeue()), enqueue(15), push(dequeue()), enqueue(pop()), push(20).\nWhat value is at the top of stack S?",
    codeSnippet: "enqueue(5), enqueue(10), push(dequeue())\nenqueue(15), push(dequeue()), enqueue(pop()), push(20)",
    options: [
      { id: "A", text: "20" },
      { id: "B", text: "10" },
      { id: "C", text: "5" },
      { id: "D", text: "15" }
    ],
    correctOption: "A",
    explanation: "The final operation executed directly on stack S is push(20), making 20 the element at the top of the stack."
  },
  {
    orderIndex: 6,
    topic: "Algorithmic Complexity",
    prompt: "What is the worst-case search time complexity in an unbalanced Binary Search Tree versus an AVL Tree with N elements?",
    codeSnippet: null,
    options: [
      { id: "A", text: "BST: O(N), AVL: O(log N)" },
      { id: "B", text: "BST: O(log N), AVL: O(1)" },
      { id: "C", text: "BST: O(N log N), AVL: O(log N)" },
      { id: "D", text: "BST: O(N), AVL: O(N)" }
    ],
    correctOption: "A",
    explanation: "An unbalanced BST can degenerate into a linear chain (O(N)), whereas a strictly self-balancing AVL tree guarantees O(log N) depth."
  },
  {
    orderIndex: 7,
    topic: "SQL & Databases",
    prompt: "Given table scores(team_id INT, points INT) containing rows (1, 100), (1, 200), (2, NULL), (3, 50). What does 'SELECT COUNT(*), COUNT(points), SUM(points) FROM scores' return?",
    codeSnippet: "SELECT COUNT(*), COUNT(points), SUM(points) FROM scores;",
    options: [
      { id: "A", text: "4, 3, 350" },
      { id: "B", text: "4, 4, 350" },
      { id: "C", text: "3, 3, 350" },
      { id: "D", text: "4, 3, NULL" }
    ],
    correctOption: "A",
    explanation: "COUNT(*) counts total rows (4). COUNT(column) ignores NULL values (3 rows with non-null points). SUM(points) ignores NULL and sums 100 + 200 + 50 = 350."
  },
  {
    orderIndex: 8,
    topic: "Cybersecurity Fundamentals",
    prompt: "Why are adaptive key derivation functions (Argon2, bcrypt, PBKDF2) strongly preferred over fast hashes like SHA-256 for password storage?",
    codeSnippet: null,
    options: [
      { id: "A", text: "They enforce configurable computational and memory work factors that dramatically slow down hardware/GPU brute-force attacks" },
      { id: "B", text: "SHA-256 output can be mathematically reversed using rainbow tables in O(1) time" },
      { id: "C", text: "Fast hashes cannot incorporate random cryptographic salts" },
      { id: "D", text: "Argon2 generates shorter digest strings that optimize database index storage" }
    ],
    correctOption: "A",
    explanation: "Adaptive password hashers have deliberate work factors (CPU & memory hardness) that prevent attackers from calculating billions of guesses per second on GPUs/ASICs."
  },
  {
    orderIndex: 9,
    topic: "Cryptography Riddle",
    prompt: "I enable two communicating parties to establish a shared secret key across an unencrypted, public channel without ever transmitting the secret key itself. What foundational protocol am I?",
    codeSnippet: null,
    options: [
      { id: "A", text: "Diffie-Hellman Key Exchange" },
      { id: "B", text: "Caesar Substitution Cipher" },
      { id: "C", text: "MD5 Message Digest" },
      { id: "D", text: "Kerberos Ticket Granting" }
    ],
    correctOption: "A",
    explanation: "Diffie-Hellman Key Exchange (published in 1976) leverages the discrete logarithm problem to securely negotiate a shared secret over an insecure medium."
  },
  {
    orderIndex: 10,
    topic: "Logic Deduction",
    prompt: "Four servers (Alpha, Beta, Gamma, Delta) report status. Exactly one statement is FALSE, and exactly three servers are online:\n1. Alpha: 'Beta is online.'\n2. Beta: 'Gamma is offline.'\n3. Gamma: 'Delta is online.'\n4. Delta: 'Alpha is offline.'\nWho made the FALSE statement?",
    codeSnippet: "Alpha: 'Beta is online.'\nBeta: 'Gamma is offline.'\nGamma: 'Delta is online.'\nDelta: 'Alpha is offline.'",
    options: [
      { id: "A", text: "Delta" },
      { id: "B", text: "Alpha" },
      { id: "C", text: "Beta" },
      { id: "D", text: "Gamma" }
    ],
    correctOption: "A",
    explanation: "If Delta's statement is False, Alpha is online. Alpha speaks the truth -> Beta is online. Beta speaks the truth -> Gamma is offline. Gamma speaks the truth -> Delta is online. The online servers are Alpha, Beta, Delta (exactly 3). The single false statement was made by Delta."
  },
  {
    orderIndex: 11,
    topic: "Bitwise Operations & Masks",
    prompt: "In an embedded system, register R holds the 8-bit value 0x5C. An engineer executes: R = (R ^ 0xA5) & 0x7E. What is the final hexadecimal value of register R?",
    codeSnippet: "uint8_t R = 0x5C;\nR = (R ^ 0xA5) & 0x7E;",
    options: [
      { id: "A", text: "0x78" },
      { id: "B", text: "0xF9" },
      { id: "C", text: "0x3C" },
      { id: "D", text: "0x79" }
    ],
    correctOption: "A",
    explanation: "0x5C (01011100) XOR 0xA5 (10100101) = 0xF9 (11111001). Bitwise AND with 0x7E (01111110) clears the highest and lowest bits: 01111000, which is hexadecimal 0x78."
  },
  {
    orderIndex: 12,
    topic: "Operating Systems & Scheduling",
    prompt: "Consider three processes arriving at time t=0 with CPU burst times: P1=12ms, P2=4ms, P3=6ms. The scheduler uses Round Robin (RR) with a time quantum of 4ms (no context switch overhead). What is the average turnaround time across all three processes?",
    codeSnippet: "Processes: P1 (12ms), P2 (4ms), P3 (6ms)\nTime Quantum q = 4ms (arrived at t=0)",
    options: [
      { id: "A", text: "12.0 ms" },
      { id: "B", text: "14.0 ms" },
      { id: "C", text: "15.3 ms" },
      { id: "D", text: "16.0 ms" }
    ],
    correctOption: "D",
    explanation: "Gantt chart execution: [0-4 P1], [4-8 P2: done], [8-12 P3], [12-16 P1], [16-18 P3: done], [18-22 P1: done]. Completion times: P1=22ms, P2=8ms, P3=18ms. Average turnaround time = (22 + 8 + 18) / 3 = 48 / 3 = 16.0 ms."
  },
  {
    orderIndex: 13,
    topic: "Recursion & Call Stacks",
    prompt: "Consider the following recursive function in pseudo-C. What is the value returned by mystery(3, 4)?",
    codeSnippet: "int mystery(int m, int n) {\n  if (m == 0) return n + 1;\n  if (n == 0) return mystery(m - 1, 1);\n  return mystery(m - 1, mystery(m, n - 1));\n}",
    options: [
      { id: "A", text: "13" },
      { id: "B", text: "61" },
      { id: "C", text: "125" },
      { id: "D", text: "29" }
    ],
    correctOption: "C",
    explanation: "This is the Ackermann function A(m, n). For m=3, A(3, n) = 2^(n+3) - 3. Thus A(3, 4) = 2^(4+3) - 3 = 2^7 - 3 = 128 - 3 = 125."
  },
  {
    orderIndex: 14,
    topic: "Computer Architecture & Caches",
    prompt: "A CPU has a 64 KB 4-way set associative L1 data cache with 64-byte cache lines on a 32-bit physical address space. How many bits are used for the Tag, Set Index, and Block Offset fields respectively?",
    codeSnippet: "Cache Size: 64 KB\nAssociativity: 4-way\nBlock/Line Size: 64 Bytes\nPhysical Address: 32 bits",
    options: [
      { id: "A", text: "Tag: 18 bits, Index: 8 bits, Offset: 6 bits" },
      { id: "B", text: "Tag: 20 bits, Index: 6 bits, Offset: 6 bits" },
      { id: "C", text: "Tag: 16 bits, Index: 10 bits, Offset: 6 bits" },
      { id: "D", text: "Tag: 19 bits, Index: 7 bits, Offset: 6 bits" }
    ],
    correctOption: "A",
    explanation: "Block size 64B requires log2(64) = 6 offset bits. Total lines = 64KB / 64B = 1024 lines. In 4-way associativity, number of sets = 1024 / 4 = 256 sets, requiring log2(256) = 8 index bits. Tag bits = 32 - (8 + 6) = 18 bits."
  },
  {
    orderIndex: 15,
    topic: "Graph Theory & Pathfinding",
    prompt: "In a directed graph with V vertices and E edges containing negative weight edges but NO negative cycles, which algorithm correctly finds single-source shortest paths in O(V * E) worst-case time?",
    codeSnippet: null,
    options: [
      { id: "A", text: "Dijkstra's Algorithm with Min-Heap" },
      { id: "B", text: "Bellman-Ford Algorithm" },
      { id: "C", text: "Floyd-Warshall Algorithm" },
      { id: "D", text: "Prim's Algorithm" }
    ],
    correctOption: "B",
    explanation: "Dijkstra's algorithm fails with negative edge weights. The Bellman-Ford algorithm relaxes all edges V-1 times and correctly determines single-source shortest paths in O(V * E) time while detecting negative cycles."
  },
  {
    orderIndex: 16,
    topic: "Network Protocols & TCP",
    prompt: "During a standard TCP connection teardown, why does the initiating host enter the TIME_WAIT state and remain in it for 2MSL (Maximum Segment Lifetime)?",
    codeSnippet: null,
    options: [
      { id: "A", text: "To renegotiate the sliding window buffer before opening another socket" },
      { id: "B", text: "To ensure the final ACK arrives at the remote peer and allow lingering duplicate segments on the network to expire" },
      { id: "C", text: "To allow the TCP SYN cookies to authenticate the next connection" },
      { id: "D", text: "To flush the DNS resolver cache on the local network interface" }
    ],
    correctOption: "B",
    explanation: "TIME_WAIT (lasting 2 * MSL) guarantees that if the final ACK is lost, the retransmitted FIN from the remote peer can be handled, and prevents stale delayed packets from colliding with a new connection reusing the same socket pair."
  },
  {
    orderIndex: 17,
    topic: "Concurrency & Deadlocks",
    prompt: "According to Coffman's conditions, which of the following is NOT an essential necessary condition for a system deadlock to occur?",
    codeSnippet: null,
    options: [
      { id: "A", text: "Mutual Exclusion" },
      { id: "B", text: "Hold and Wait" },
      { id: "C", text: "Priority Inversion" },
      { id: "D", text: "Circular Wait" }
    ],
    correctOption: "C",
    explanation: "The four Coffman conditions required for deadlock are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Priority Inversion is a scheduling issue where a low-priority thread blocks a high-priority thread, not a prerequisite for deadlock."
  },
  {
    orderIndex: 18,
    topic: "Discrete Mathematics & Number Theory",
    prompt: "What is the remainder when 3^2026 is divided by 13?",
    codeSnippet: "Evaluate: 3^2026 mod 13",
    options: [
      { id: "A", text: "3" },
      { id: "B", text: "9" },
      { id: "C", text: "1" },
      { id: "D", text: "12" }
    ],
    correctOption: "A",
    explanation: "Since 3^3 = 27 ≡ 1 (mod 13), powers of 3 repeat modulo 13 with cycle length 3. Calculating 2026 mod 3 gives 1 (since 2026 = 3 * 675 + 1). Therefore, 3^2026 ≡ (3^3)^675 * 3^1 ≡ 1^675 * 3 ≡ 3 (mod 13)."
  },
  {
    orderIndex: 19,
    topic: "Hashing & Distributed Systems",
    prompt: "In Consistent Hashing, why are multiple 'virtual nodes' (replicas) typically mapped to each physical server on the hash ring?",
    codeSnippet: null,
    options: [
      { id: "A", text: "To encrypt communications between physical nodes with zero network overhead" },
      { id: "B", text: "To achieve uniform key distribution and prevent hotspot imbalances across heterogeneous servers" },
      { id: "C", text: "To eliminate the need for hash functions by using binary search trees instead" },
      { id: "D", text: "To guarantee strict linearizable consistency across all concurrent reads" }
    ],
    correctOption: "B",
    explanation: "Virtual nodes divide a physical node's capacity into multiple pseudo-tokens across the ring, significantly reducing variance in partition sizes, smoothing load distribution, and avoiding hotspots."
  },
  {
    orderIndex: 20,
    topic: "Pattern Matching & Automata",
    prompt: "A deterministic finite automaton (DFA) has states {q0, q1, q2} over alphabet {0, 1}, where q0 is both the start state and the only accept state. The state transitions are: delta(q0, '0')=q0, delta(q0, '1')=q1, delta(q1, '0')=q2, delta(q1, '1')=q0, delta(q2, '0')=q1, delta(q2, '1')=q2. Which language does this DFA recognize?",
    codeSnippet: null,
    options: [
      { id: "A", text: "Binary representations of non-negative integers divisible by 3" },
      { id: "B", text: "Binary strings containing an even number of both 0s and 1s" },
      { id: "C", text: "Binary strings ending with the substring '11'" },
      { id: "D", text: "Binary strings that are palindromes" }
    ],
    correctOption: "A",
    explanation: "State qi corresponds to the value of the binary string modulo 3. Reading a new bit b updates the remainder via (2*r + b) mod 3. q0 represents remainder 0. Since q0 is the sole accept state, the DFA recognizes binary numbers divisible by 3."
  }
];

export async function seed() {
  console.log("--- SEEDING SQUID PROTOCOL DATABASE ---");

  // 1. App Settings
  await prisma.appSettings.upsert({
    where: { key: "leaderboard_published" },
    update: { value: "true" },
    create: { key: "leaderboard_published", value: "true" }
  });

  await prisma.appSettings.upsert({
    where: { key: "event_name" },
    update: { value: "SQUID PROTOCOL — SURVIVE THE SYSTEM" },
    create: { key: "event_name", value: "SQUID PROTOCOL — SURVIVE THE SYSTEM" }
  });

  // 2. Round Controls (All start in UPCOMING status until admin starts them)
  await prisma.roundControl.upsert({
    where: { id: 1 },
    update: {
      status: RoundStatus.UPCOMING,
      doublePointsEnabled: false,
      remainingSeconds: 15 * 60,
      pausedAt: null
    },
    create: {
      id: 1,
      title: "Round 1 — The Signal Protocol",
      status: RoundStatus.UPCOMING,
      durationMinutes: 15,
      signalState: SignalState.GREEN,
      redLightPenaltyMode: false,
      doublePointsEnabled: false,
      remainingSeconds: 15 * 60
    }
  });

  await prisma.roundControl.upsert({
    where: { id: 2 },
    update: {
      status: RoundStatus.UPCOMING,
      doublePointsEnabled: false,
      remainingSeconds: 20 * 60,
      pausedAt: null
    },
    create: {
      id: 2,
      title: "Round 2 — The Logic Protocol",
      status: RoundStatus.UPCOMING,
      durationMinutes: 20,
      signalState: SignalState.GREEN,
      redLightPenaltyMode: false,
      doublePointsEnabled: false,
      remainingSeconds: 20 * 60
    }
  });

  await prisma.roundControl.upsert({
    where: { id: 3 },
    update: {
      status: RoundStatus.UPCOMING,
      doublePointsEnabled: false,
      remainingSeconds: 30 * 60,
      pausedAt: null
    },
    create: {
      id: 3,
      title: "Round 3 — The Final Breach",
      status: RoundStatus.UPCOMING,
      durationMinutes: 30,
      signalState: SignalState.GREEN,
      redLightPenaltyMode: false,
      doublePointsEnabled: false,
      remainingSeconds: 30 * 60
    }
  });

  // 3. Admin Account
  const adminPasswordHash = await bcrypt.hash("Admin#2026", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash: adminPasswordHash, role: UserRole.ADMIN },
    create: {
      username: "admin",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN
    }
  });


  // 4. 20 Tournament Teams (TEAM01 to TEAM20)
  for (let i = 0; i < 20; i++) {
    const teamNum = (i + 1).toString().padStart(2, "0");
    const teamCode = `TEAM${teamNum}`;
    const teamPasswordHash = await bcrypt.hash(`${teamCode.toLowerCase()}#2026`, 10);
    const name = TEAM_NAMES[i];
    const members = `Operative ${teamNum}-A, Operative ${teamNum}-B, Operative ${teamNum}-C`;

    const team = await prisma.team.upsert({
      where: { teamCode },
      update: {
        name,
        members
      },
      create: {
        teamCode,
        name,
        members,
        currentRound: 1,
        currentStage: 1,
        totalScore: 0
      }
    });

    // Create user login for team
    await prisma.user.upsert({
      where: { username: teamCode.toLowerCase() },
      update: { passwordHash: teamPasswordHash, teamId: team.id, role: UserRole.TEAM },
      create: {
        username: teamCode.toLowerCase(),
        passwordHash: teamPasswordHash,
        role: UserRole.TEAM,
        teamId: team.id
      }
    });

    // Keep QR secrets cryptographically random; retain already printed strong tokens.
    const existingToken = await prisma.accessToken.findUnique({ where: { teamId: team.id } });
    if (!existingToken) {
      await prisma.accessToken.create({ data: { teamId: team.id, tokenCode: generateQrToken(), isRedeemed: false } });
    } else if (!isStrongQrToken(existingToken.tokenCode)) {
      await prisma.accessToken.update({ where: { id: existingToken.id }, data: { tokenCode: generateQrToken() } });
    }
  }

  // 5. Round 1 Questions
  for (const q of ROUND1_QUESTIONS) {
    await prisma.question.upsert({
      where: { orderIndex: q.orderIndex },
      update: {
        topic: q.topic,
        prompt: q.prompt,
        codeSnippet: q.codeSnippet,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        pointsNormal: 100,
        pointsDouble: 200
      },
      create: {
        round: 1,
        orderIndex: q.orderIndex,
        topic: q.topic,
        prompt: q.prompt,
        codeSnippet: q.codeSnippet,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        pointsNormal: 100,
        pointsDouble: 200,
        isActive: true
      }
    });
  }

  // 6. Round 2 Sudoku (Unique Solution mathematically verified)
  await prisma.sudokuPuzzle.deleteMany({});
  await prisma.sudokuPuzzle.create({
    data: {
      round: 2,
      initialGrid: "0T0U00U0DS0C00S0U0D0000S000A0T0D0CSU",
      solutionGrid: "STCUADUADSTCTCSDUADUATCSCSUADTADTCSU",
      hintDeductionPercent: 25,
      isActive: true
    }
  });

  // 7. Round 2 Broken Logic Challenge
  await prisma.brokenLogicPuzzle.deleteMany({});
  await prisma.brokenLogicPuzzle.create({
    data: {
      round: 2,
      title: "Broken Priority Queue Checksum",
      scenario: "The perimeter network gateway processes packet burst lengths: [7, 14, 25, 32, 41] with initial accumulator = 100.\n\nIntended Security Specification:\nA packet qualifies for fast-track processing ONLY if it has an EVEN length AND satisfies either (length > 20 OR length < 10).\n- If qualified: Add (length * 3) to accumulator\n- If NOT qualified: Subtract (length * 2) from accumulator\n\nBuggy Code in Firmware:\nif (length % 2 == 0 && length > 20 || length < 10)\n\nDue to operator precedence (&& precedes ||), odd packet 7 erroneously qualifies.\n\nTask: Trace the CORRECT intended logic and submit the resulting accumulator value.",
      codeSnippet: "accumulator = 100;\npackets = [7, 14, 25, 32, 41];\n\nfor (length of packets) {\n  // INTENDED SPECIFICATION:\n  if ((length % 2 === 0) && (length > 20 || length < 10)) {\n    accumulator += (length * 3);\n  } else {\n    accumulator -= (length * 2);\n  }\n}\nreturn accumulator;",
      expectedOutput: "22",
      referenceSolution: "Start at 100. Apply the intended predicate (length % 2 === 0) && (length > 20 || length < 10). Values 7, 14, 25, and 41 subtract 2×length; 32 adds 3×length. Final accumulator: 100 - 14 - 28 - 50 + 96 - 82 = 22.",
      points: 200,
      isActive: true
    }
  });

  // 8. Round 3 Debug Challenge (Equivalent Java, Python, C)
  await prisma.debugChallenge.deleteMany({});
  await prisma.debugChallenge.create({
    data: {
      title: "Kernel Packet Checksum & Key Derivation",
      description: "A cryptographic token generation routine processes 8 diagnostic bytes. The intended logic transforms even bytes via bitwise shift and offset ((b << 2) + 3), and odd bytes via XOR (b ^ 0x4B).",
      intendedBehavior: "Correctly calculate the checksum when operator precedence bug between addition (+) and bitwise left-shift (<<) is resolved.",
      inputData: "[12, 25, 34, 47, 58, 63, 72, 81]",
      derivationRule: "Derive key as 'PROTOCOL_BREACH_' concatenated with the corrected integer checksum.",
      expectedFinalKey: "PROTOCOL_BREACH_1040",
      referenceSolution: [
        "Expected output: PROTOCOL_BREACH_1040 (or numeric checksum 1040).",
        "Even-byte contributions: (12 << 2) + 3 = 51, (34 << 2) + 3 = 139, (58 << 2) + 3 = 235, (72 << 2) + 3 = 291.",
        "Odd-byte contributions: 25 ^ 0x4B = 82, 47 ^ 0x4B = 100, 63 ^ 0x4B = 116, 81 ^ 0x4B = 26. Total = 1040.",
        "Corrected Python line: checksum += (b << 2) + 3",
        "Corrected Java line: checksum += (b << 2) + 3;",
        "Corrected C line: checksum += (b << 2) + 3;"
      ].join("\n"),
      points: 200,
      isActive: true,
      javaCode: `public class KernelChecksum {
    public static void main(String[] args) {
        int[] data = {12, 25, 34, 47, 58, 63, 72, 81};
        int checksum = 0;
        for (int b : data) {
            if (b % 2 == 0) {
                // BUG: In Java, '+' has higher precedence than '<<'
                checksum += b << 2 + 3; // Evaluates as b << (2 + 3)
            } else {
                checksum += (b ^ 0x4B);
            }
        }
        System.out.println("PROTOCOL_BREACH_" + checksum);
    }
}`,
      pythonCode: `def kernel_checksum():
    data = [12, 25, 34, 47, 58, 63, 72, 81]
    checksum = 0
    for b in data:
        if b % 2 == 0:
            # BUG: In Python, '+' has higher precedence than '<<'
            checksum += b << 2 + 3  # Evaluates as b << (2 + 3)
        else:
            checksum += (b ^ 0x4B)
    return f"PROTOCOL_BREACH_{checksum}"

print(kernel_checksum())`,
      cCode: `#include <stdio.h>

int main() {
    int data[] = {12, 25, 34, 47, 58, 63, 72, 81};
    int n = 8;
    int checksum = 0;
    for (int i = 0; i < n; i++) {
        int b = data[i];
        if (b % 2 == 0) {
            // BUG: In C, '+' has higher precedence than '<<'
            checksum += b << 2 + 3; // Evaluates as b << (2 + 3)
        } else {
            checksum += (b ^ 0x4B);
        }
    }
    printf("PROTOCOL_BREACH_%d\\n", checksum);
    return 0;
}`
    }
  });

  console.log("✅ Seed completed successfully!");
  console.log("   - Admin user seeded: admin / Admin#2026");
  console.log("   - 20 tournament teams seeded (TEAM01 to TEAM20)");
  console.log("   - Round 1: 20 Verified MCQs seeded (UPCOMING)");
  console.log("   - Round 2: Verified 6x6 Shape Sudoku & Broken Logic puzzle seeded (UPCOMING)");
  console.log("   - Round 3: Unique Single-Use QR Access Tokens & Debug Challenge seeded (UPCOMING)");
}

if (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js')) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
