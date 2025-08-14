import mongoose from 'mongoose';

async function dropIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/uber-clone');
    console.log('✅ MongoDB Connected');

    // Get the Driver collection
    const driverCollection = mongoose.connection.collection('drivers');

    // Drop all indexes except the _id index
    await driverCollection.dropIndexes();
    console.log('✅ All indexes dropped from drivers collection');

    // Create only the necessary indexes
    await driverCollection.createIndex({ email: 1 }, { unique: false });
    await driverCollection.createIndex({ licenseNumber: 1 }, { unique: false });
    await driverCollection.createIndex({ vehicleNumber: 1 }, { unique: false });
    console.log('✅ New non-unique indexes created');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
dropIndexes();