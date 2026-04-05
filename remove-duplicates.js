require('dotenv').config();
const mongoose = require('mongoose');

const IdeaTrackApplication = require('./models/IdeaTrackApplication');
const BuildTrackApplication = require('./models/BuildTrackApplication');
const ScaleTrackApplication = require('./models/ScaleTrackApplication');

async function findAndRemoveDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const collections = [
      { name: 'Idea Track', model: IdeaTrackApplication, key: 'email' },
      { name: 'Build Track', model: BuildTrackApplication, key: 'email' },
      { name: 'Scale Track', model: ScaleTrackApplication, key: 'email' }
    ];

    let totalDuplicatesFound = 0;
    let totalDuplicatesRemoved = 0;

    for (const collection of collections) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Checking ${collection.name} Applications`);
      console.log('='.repeat(60));

      // Find duplicates by email
      const duplicates = await collection.model.aggregate([
        {
          $group: {
            _id: `$${collection.key}`,
            count: { $sum: 1 },
            ids: { $push: '$_id' },
            createdAts: { $push: '$createdAt' }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        }
      ]);

      if (duplicates.length === 0) {
        console.log(`✓ No duplicates found in ${collection.name}`);
        continue;
      }

      console.log(`\nFound ${duplicates.length} duplicate email(s):\n`);

      for (const dup of duplicates) {
        totalDuplicatesFound += dup.count - 1;
        
        // Get full documents to show details
        const docs = await collection.model.find({ _id: { $in: dup.ids } }).sort({ createdAt: 1 });
        
        console.log(`Email: ${dup._id}`);
        console.log(`  Total submissions: ${dup.count}`);
        console.log(`  Original (KEEPING): ${docs[0]._id} - ${docs[0].createdAt.toISOString()}`);
        console.log(`  Duplicates (REMOVING):`);
        
        // Keep the first (oldest) record, remove the rest
        const idsToRemove = dup.ids.slice(1);
        
        for (let i = 1; i < docs.length; i++) {
          console.log(`    - ${docs[i]._id} - ${docs[i].createdAt.toISOString()}`);
        }

        // Remove duplicates
        const result = await collection.model.deleteMany({ _id: { $in: idsToRemove } });
        totalDuplicatesRemoved += result.deletedCount;
        console.log(`  ✓ Removed ${result.deletedCount} duplicate(s)\n`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total duplicate records found: ${totalDuplicatesFound}`);
    console.log(`Total duplicate records removed: ${totalDuplicatesRemoved}`);
    console.log(`Original records preserved: ${totalDuplicatesFound > 0 ? 'YES' : 'N/A'}`);
    console.log('='.repeat(60));

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

findAndRemoveDuplicates();
