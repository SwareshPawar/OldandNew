/**
 * migrate-loops-to-set-naming.js
 *
 * Migrates all loop files from the old conditions-based naming convention to the new
 * rhythmSetId-based naming convention (v3.0).
 *
 * OLD: {taal}_{timeSignature}_{tempo}_{genre}_{TYPE}{number}.wav
 *   e.g. dadra_3_4_medium_dholak_LOOP1.wav
 *
 * NEW: {rhythmSetId}_{TYPE}{number}.wav
 *   e.g. dadra_fast_2_LOOP1.wav
 *
 * Changes applied:
 *  - Renames the physical WAV file on disk (if the old name differs from the new name)
 *  - Updates loops-metadata.json:  id, filename, files[loopKey]
 *  - Writes a backup of the original metadata before touching anything
 *
 * Usage:
 *   node migrate-loops-to-set-naming.js [--dry-run]
 *
 * Options:
 *   --dry-run   Print what would happen without changing anything on disk or in metadata.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const LOOPS_DIR     = path.join(__dirname, 'loops');
const METADATA_PATH = path.join(LOOPS_DIR, 'loops-metadata.json');

const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) {
  console.log('🔍  DRY-RUN mode — no files will be changed.\n');
}

// ── Load metadata ─────────────────────────────────────────────────────────────
if (!fs.existsSync(METADATA_PATH)) {
  console.error('❌  loops-metadata.json not found at:', METADATA_PATH);
  process.exit(1);
}

const metadata   = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
const loops      = metadata.loops || [];

// ── Backup original metadata ──────────────────────────────────────────────────
if (!DRY_RUN) {
  const backupPath = METADATA_PATH.replace('.json', `_backup_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(metadata, null, 2));
  console.log(`💾  Metadata backed up to: ${path.basename(backupPath)}\n`);
}

// ── Utility ───────────────────────────────────────────────────────────────────
function newFilename(entry) {
  const typeUpper = entry.type.toUpperCase();   // LOOP | FILL
  return `${entry.rhythmSetId}_${typeUpper}${entry.number}.wav`;
}

function newId(entry) {
  return `${entry.rhythmSetId}_${entry.type}${entry.number}`;
}

// ── Track ops ─────────────────────────────────────────────────────────────────
const stats = {
  total:      loops.length,
  renamed:    0,   // file physically renamed
  skipped:    0,   // already had correct name
  noFile:     0,   // metadata entry but file missing on disk (orphaned)
  conflict:   0,   // target filename already occupied by a *different* file
  errors:     0,
};

const seen = new Map(); // newFilename → entry.id  (detect duplicate targets)

// ── Process each entry ────────────────────────────────────────────────────────
for (const entry of loops) {
  if (!entry.rhythmSetId) {
    console.warn(`⚠️   Entry "${entry.id}" has no rhythmSetId — skipping.`);
    stats.errors++;
    continue;
  }
  if (typeof entry.type !== 'string' || !Number.isFinite(Number(entry.number))) {
    console.warn(`⚠️   Entry "${entry.id}" has invalid type/number — skipping.`);
    stats.errors++;
    continue;
  }

  const oldName = entry.filename;
  const target  = newFilename(entry);
  const targetId = newId(entry);

  // ── Detect duplicate targets ──────────────────────────────────────────────
  if (seen.has(target)) {
    console.warn(`⚠️   CONFLICT: "${target}" is the target of both "${seen.get(target)}" and "${entry.id}". Skipping the later one.`);
    stats.conflict++;
    continue;
  }
  seen.set(target, entry.id);

  // ── Already correct? ──────────────────────────────────────────────────────
  if (oldName === target) {
    // Ensure metadata id is also updated (it may still use the old pattern)
    if (entry.id !== targetId || !entry.files || entry.files[`${entry.type}${entry.number}`] !== target) {
      if (!DRY_RUN) {
        entry.id = targetId;
        entry.files = { [`${entry.type}${entry.number}`]: target };
      }
      console.log(`🔧  Metadata id/files updated (filename already correct): ${oldName}`);
    } else {
      console.log(`✅  Already correct: ${oldName}`);
    }
    stats.skipped++;
    continue;
  }

  // ── Physical rename ───────────────────────────────────────────────────────
  const oldPath    = path.join(LOOPS_DIR, oldName);
  const targetPath = path.join(LOOPS_DIR, target);

  const oldExists    = fs.existsSync(oldPath);
  const targetExists = fs.existsSync(targetPath);

  if (!oldExists && !targetExists) {
    console.warn(`⚠️   File missing on disk: "${oldName}" (target "${target}" also absent) — metadata updated only.`);
    stats.noFile++;
    if (!DRY_RUN) {
      entry.id       = targetId;
      entry.filename = target;
      entry.files    = { [`${entry.type}${entry.number}`]: target };
    }
    continue;
  }

  if (!oldExists && targetExists) {
    // File was already renamed in a previous partial run — just fix metadata
    console.log(`↩️   File already at new path, fixing metadata only: ${target}`);
    if (!DRY_RUN) {
      entry.id       = targetId;
      entry.filename = target;
      entry.files    = { [`${entry.type}${entry.number}`]: target };
    }
    stats.skipped++;
    continue;
  }

  if (targetExists) {
    // Both old and new paths exist — the new path belongs to a different (already-migrated)
    // entry. Delete the old file so we don't leave orphans; metadata already points to the
    // new file for whatever entry claimed this target first.
    console.warn(`⚠️   Target already exists: "${target}" — removing old duplicate "${oldName}".`);
    if (!DRY_RUN) {
      fs.unlinkSync(oldPath);
      entry.id       = targetId;
      entry.filename = target;
      entry.files    = { [`${entry.type}${entry.number}`]: target };
    }
    stats.conflict++;
    continue;
  }

  // Normal case — rename and update metadata
  console.log(`🔄  ${DRY_RUN ? '[DRY] ' : ''}${oldName}  →  ${target}`);
  if (!DRY_RUN) {
    fs.renameSync(oldPath, targetPath);
    entry.id       = targetId;
    entry.filename = target;
    entry.files    = { [`${entry.type}${entry.number}`]: target };
  }
  stats.renamed++;
}

// ── Save updated metadata ─────────────────────────────────────────────────────
if (!DRY_RUN) {
  fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
  console.log('\n✅  loops-metadata.json saved.');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n── Migration summary ─────────────────────────────────');
console.log(`  Total entries:  ${stats.total}`);
console.log(`  Renamed:        ${stats.renamed}`);
console.log(`  Already OK:     ${stats.skipped}`);
console.log(`  Missing file:   ${stats.noFile}`);
console.log(`  Conflicts:      ${stats.conflict}`);
console.log(`  Errors:         ${stats.errors}`);
if (DRY_RUN) {
  console.log('\n  (No changes were made — re-run without --dry-run to apply)');
}
console.log('─────────────────────────────────────────────────────\n');
