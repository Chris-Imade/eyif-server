require('dotenv').config();
const mongoose = require('mongoose');

// Define schemas for OLD collections (without _2026 suffix)
const IdeaTrackSchemaOld = new mongoose.Schema({}, { strict: false, collection: 'ideatrackapplications' });
const BuildTrackSchemaOld = new mongoose.Schema({}, { strict: false, collection: 'buildtrackapplications' });
const ScaleTrackSchemaOld = new mongoose.Schema({}, { strict: false, collection: 'scaletrackapplications' });

const IdeaTrackOld = mongoose.model('IdeaTrackOld', IdeaTrackSchemaOld);
const BuildTrackOld = mongoose.model('BuildTrackOld', BuildTrackSchemaOld);
const ScaleTrackOld = mongoose.model('ScaleTrackOld', ScaleTrackSchemaOld);

async function findAndRemoveDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    console.log('Checking LAST YEAR\'S collections (without _2026 suffix)\n');

    const collections = [
      { name: 'Idea Track (Old)', model: IdeaTrackOld, key: 'fullName' },
      { name: 'Build Track (Old)', model: BuildTrackOld, key: 'fullName' },
      { name: 'Scale Track (Old)', model: ScaleTrackOld, key: 'fullName' }
    ];

    let totalDuplicatesFound = 0;
    let totalDuplicatesRemoved = 0;

    for (const collection of collections) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Checking ${collection.name} Applications`);
      console.log('='.repeat(60));

      // Find duplicates by fullName
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

      console.log(`\nFound ${duplicates.length} duplicate fullName(s):\n`);

      for (const dup of duplicates) {
        totalDuplicatesFound += dup.count - 1;
        
        // Get full documents to show details
        const docs = await collection.model.find({ _id: { $in: dup.ids } }).sort({ createdAt: 1 });
        
        console.log(`Full Name: ${dup._id}`);
        console.log(`  Total submissions: ${dup.count}`);
        
        if (docs[0]) {
          console.log(`  Original (KEEPING): ${docs[0]._id} - ${docs[0].createdAt ? docs[0].createdAt.toISOString() : 'No date'}`);
          if (docs[0].fullName) console.log(`    Name: ${docs[0].fullName}`);
        }
        
        console.log(`  Duplicates (REMOVING):`);
        
        // Keep the first (oldest) record, remove the rest
        const idsToRemove = dup.ids.slice(1);
        
        for (let i = 1; i < docs.length; i++) {
          console.log(`    - ${docs[i]._id} - ${docs[i].createdAt ? docs[i].createdAt.toISOString() : 'No date'}`);
          if (docs[i].fullName) console.log(`      Name: ${docs[i].fullName}`);
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
    console.log(`Original records preserved: ${totalDuplicatesFound > 0 ? 'YES ✓' : 'N/A'}`);
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
