// Turkey Run: The Great Thanksgiving Escape — the hand-in program.
// Node 22, standard library only. It copies this repository's game/ and
// screenshots/ into /output (or MAKEFUN_OUTPUT_DIR outside the grader)
// and writes /output/dossier.json with buildDossier from the vendored
// make.fun library, exactly the summary the judge reads. The program runs
// twice and both runs must write the same bytes, so it does nothing
// time- or randomness-dependent: a plain copy and a deterministic dossier.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own caps for this bounty (from the kit's RULES.txt): the
// dossier text is capped at 160 KiB, at most 4 screenshots of 256 KiB
// each, game/ at most 993 files and 48 MiB in all. Refuse early rather
// than hand in an entry the scorer would refuse.
const DOSSIER = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Start from a clean output directory so a stale file from an earlier
// run can never leak into this one and break the byte-identical rule.
// The directory itself must stay put: in the grader /output is a mounted
// volume, and removing a mount point fails with EBUSY. So clear what is
// inside it instead of removing the directory.
mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) {
  rmSync(join(out, name), { recursive: true, force: true });
}

// The playable game: plain static files, game/index.html and its modules.
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

// The screenshots: real renders of the game's own code, first by name
// is the cover. Copy only when the folder exists, so a bare checkout
// without screenshots still produces a dossier instead of crashing.
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The dossier: the judge's view of the game, written by the vendored
// library from the files just copied, so it always matches /output.
writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER));
