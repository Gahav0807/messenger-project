const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URL;

const connectDB = async () => {
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Подключение к MongoDB успешно');
}).catch((error) => {
    console.log('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
});
}

module.exports = { connectDB };
