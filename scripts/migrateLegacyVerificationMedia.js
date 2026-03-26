import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';
import User from '../models/User.js';
import VerificationSubmission from '../models/VerificationSubmission.js';
import { saveVerificationMediaFromDataUrl } from '../utils/verificationStorage.js';

dotenv.config();

const args = process.argv.slice(2);
const hasArg = (flag) => args.includes(flag);
const getArgValue = (flag, fallback = '') => {
  const index = args.findIndex((item) => item === flag);
  if (index === -1 || index + 1 >= args.length) return fallback;
  return args[index + 1];
};

const DRY_RUN = hasArg('--dry-run') || !hasArg('--execute');
const LIMIT = Number(getArgValue('--limit', '0')) || 0;
const FORCE = hasArg('--force');
const KEEP_LEGACY = hasArg('--keep-legacy');

const isDataUrl = (value) => /^data:[^;]+;base64,/.test(String(value || '').trim());

const buildHistoryNote = (text) => String(text || '').trim().slice(0, 1000);

const migrateOneUser = async (user) => {
  const livePhoto = String(user.livePhoto || '').trim();
  const idCard = String(user.idCard || '').trim();

  const hasSelfieDataUrl = isDataUrl(livePhoto);
  const hasIdDataUrl = isDataUrl(idCard);

  if (!hasSelfieDataUrl || !hasIdDataUrl) {
    return {
      status: 'skipped',
      reason: 'legacy_fields_not_data_url',
      userId: String(user._id)
    };
  }

  const existingSubmission = await VerificationSubmission.findOne({ userId: user._id });
  if (existingSubmission && !FORCE && existingSubmission?.documents?.selfie?.storageKey && existingSubmission?.documents?.idProof?.storageKey) {
    return {
      status: 'skipped',
      reason: 'submission_already_exists',
      userId: String(user._id)
    };
  }

  const selfieDocument = await saveVerificationMediaFromDataUrl({
    userId: user._id,
    documentType: 'selfie',
    dataUrl: livePhoto
  });
  const idProofDocument = await saveVerificationMediaFromDataUrl({
    userId: user._id,
    documentType: 'id-proof',
    dataUrl: idCard
  });

  if (DRY_RUN) {
    return {
      status: 'would_migrate',
      userId: String(user._id),
      email: user.email,
      selfieBytes: selfieDocument.sizeBytes,
      idProofBytes: idProofDocument.sizeBytes
    };
  }

  let submission = existingSubmission;
  if (!submission) {
    submission = new VerificationSubmission({
      userId: user._id,
      status: 'pending',
      idProofType: 'government_id',
      documents: {
        selfie: {
          ...selfieDocument,
          originalName: 'legacy-live-photo'
        },
        idProof: {
          ...idProofDocument,
          originalName: 'legacy-id-card'
        }
      },
      history: [{ action: 'submitted', note: buildHistoryNote('Migrated from legacy user fields') }]
    });
  } else {
    submission.status = submission.status === 'approved' ? 'approved' : 'pending';
    submission.documents = {
      selfie: {
        ...selfieDocument,
        originalName: 'legacy-live-photo'
      },
      idProof: {
        ...idProofDocument,
        originalName: 'legacy-id-card'
      }
    };
    submission.history.push({
      action: 'resubmitted',
      note: buildHistoryNote('Legacy verification media migrated and replaced')
    });
  }

  await submission.save();

  user.verification_submission = submission._id;
  if (!user.verification_status || user.verification_status === 'not_submitted') {
    user.verification_status = 'pending';
  }

  if (!KEEP_LEGACY) {
    user.livePhoto = undefined;
    user.idCard = undefined;
  }

  user.updated_at = new Date();
  await user.save();

  return {
    status: 'migrated',
    userId: String(user._id),
    email: user.email
  };
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }

  if (uri.startsWith('mongodb+srv://')) {
    const dnsServers = (process.env.MONGODB_DNS_SERVERS || '8.8.8.8,1.1.1.1')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (dnsServers.length > 0) {
      dns.setServers(dnsServers);
      console.log(`Using DNS resolvers: ${dnsServers.join(', ')}`);
    }
  }

  console.log('Starting legacy verification migration...');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'EXECUTE'}`);
  console.log(`Options: limit=${LIMIT || 'all'}, force=${FORCE}, keepLegacy=${KEEP_LEGACY}`);

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB');

  try {
    const filter = {
      role: 'user',
      $or: [
        { livePhoto: { $exists: true, $ne: '' } },
        { idCard: { $exists: true, $ne: '' } }
      ]
    };

    let query = User.find(filter)
      .select('_id email livePhoto idCard verification_submission verification_status')
      .sort({ updated_at: 1 });

    if (LIMIT > 0) {
      query = query.limit(LIMIT);
    }

    const users = await query.lean(false);
    console.log(`Found ${users.length} user(s) with legacy verification fields`);

    const counters = {
      migrated: 0,
      would_migrate: 0,
      skipped: 0,
      failed: 0
    };

    for (const user of users) {
      try {
        const result = await migrateOneUser(user);
        counters[result.status] = (counters[result.status] || 0) + 1;

        const detail = result.reason ? ` (${result.reason})` : '';
        console.log(`- ${result.status.toUpperCase()} ${user.email || user._id}${detail}`);
      } catch (error) {
        counters.failed += 1;
        console.error(`- FAILED ${user.email || user._id}: ${error.message}`);
      }
    }

    console.log('\nMigration summary:');
    console.log(`  migrated: ${counters.migrated}`);
    console.log(`  would_migrate: ${counters.would_migrate}`);
    console.log(`  skipped: ${counters.skipped}`);
    console.log(`  failed: ${counters.failed}`);

    if (DRY_RUN) {
      console.log('\nDry-run completed. Re-run with --execute to apply changes.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

run().catch((error) => {
  console.error('Migration crashed:', error);
  process.exit(1);
});
