const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false // Disable logging for cleaner output
});

// Define Booking Model
const Booking = sequelize.define('Booking', {
    booking_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    customer_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    guest_count: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    booking_date: {
        type: DataTypes.STRING, // Format: YYYY-MM-DD
        allowNull: false
    },
    time_slot: {
        type: DataTypes.STRING, // Format: HH:MM
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Confirmed', 'Cancelled', 'Completed'),
        defaultValue: 'Pending'
    },
    source: {
        type: DataTypes.ENUM('Online', 'Manual'),
        defaultValue: 'Online'
    }
});

module.exports = { sequelize, Booking };
