# Paw Care Veterinary Clinic - MySQL Setup Guide

This guide will help you set up the Paw Care application with MySQL database in Eclipse.

## Prerequisites

1. **Eclipse IDE** with Java 17 support
2. **MySQL Server** (8.0 or higher)
3. **Maven** (usually included with Eclipse)
4. **Java 17** JDK

## Step 1: MySQL Database Setup

### 1.1 Install MySQL Server
- Download and install MySQL Server from https://dev.mysql.com/downloads/mysql/
- During installation, set a root password (remember this password)
- Start MySQL service

### 1.2 Create Database
```sql
-- Connect to MySQL as root user
mysql -u root -p

-- Create database
CREATE DATABASE pawcare_db;
USE pawcare_db;

-- Create user (optional, for security)
CREATE USER 'pawcare_user'@'localhost' IDENTIFIED BY 'pawcare_password';
GRANT ALL PRIVILEGES ON pawcare_db.* TO 'pawcare_user'@'localhost';
FLUSH PRIVILEGES;
```

## Step 2: Eclipse Project Setup

### 2.1 Import Project
1. Open Eclipse IDE
2. File → Import → Existing Maven Projects
3. Browse to the `pawcare-backend` folder
4. Click Finish

### 2.2 Configure Database Connection
1. Open `src/main/resources/application.properties`
2. Update the database connection details:

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/pawcare_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_ROOT_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

Replace `YOUR_MYSQL_ROOT_PASSWORD` with your actual MySQL root password.

### 2.3 Maven Dependencies
The project should automatically download dependencies. If not:
1. Right-click project → Maven → Reload Projects
2. Or run: `mvn clean install` in terminal

## Step 3: Run the Application

### 3.1 Start the Backend
1. Right-click on `PawcareApplication.java`
2. Run As → Java Application
3. The application will start on port 8080
4. Check console for "Started PawcareApplication" message

### 3.2 Verify Database Connection
- The application will automatically create tables on first run
- Check MySQL to see the created tables:
```sql
USE pawcare_db;
SHOW TABLES;
```

## Step 4: Frontend Configuration

### 4.1 Enable API Mode
1. Open `assets/api.js`
2. Change the first line to enable API mode:
```javascript
window.USE_API = true; // Change from false to true
```

### 4.2 Test Frontend
1. Open `index.html` in a web browser
2. Login with demo credentials:
   - Admin: username: `admin`, password: `admin123`
   - Vet: username: `vet`, password: `vet123`
   - Receptionist: username: `reception`, password: `reception123`
   - Pharmacist: username: `pharm`, password: `pharm123`

## Step 5: Verify Everything Works

### 5.1 Test Database Operations
1. Add a new pet record
2. Create an appointment
3. Issue a prescription
4. Check MySQL to see the data:
```sql
SELECT * FROM pets;
SELECT * FROM appointments;
SELECT * FROM prescriptions;
```

### 5.2 Test Reports
1. Go to Reports page
2. Mark some appointments as "Done"
3. Check if "Appointments Done" count updates
4. Verify data persists after restart

## Troubleshooting

### Common Issues

1. **Connection Refused Error**
   - Check if MySQL service is running
   - Verify database credentials in `application.properties`

2. **Port 8080 Already in Use**
   - Change port in `application.properties`: `server.port=8081`
   - Update frontend API base URL accordingly

3. **Maven Dependencies Issues**
   - Right-click project → Maven → Reload Projects
   - Check internet connection for dependency downloads

4. **Database Tables Not Created**
   - Check MySQL connection settings
   - Ensure database exists and user has proper permissions
   - Check application logs for errors

### Useful Commands

```bash
# Check MySQL status
sudo systemctl status mysql

# Start MySQL service
sudo systemctl start mysql

# Connect to MySQL
mysql -u root -p

# Check if database exists
SHOW DATABASES;

# Check tables
USE pawcare_db;
SHOW TABLES;
```

## Project Structure

```
pawcare-backend/
├── src/main/java/com/pawcare/
│   ├── entity/          # JPA entities
│   ├── repository/      # JPA repositories
│   ├── service/         # Business logic
│   ├── web/            # REST controllers
│   ├── config/         # Configuration classes
│   └── dto/            # Data transfer objects
├── src/main/resources/
│   └── application.properties
└── pom.xml
```

## Next Steps

1. **Customize Database**: Modify entities to add more fields
2. **Add Security**: Implement JWT authentication
3. **Add Validation**: Add more validation rules
4. **Deploy**: Deploy to cloud platform (AWS, Azure, etc.)

## Support

If you encounter issues:
1. Check Eclipse console for error messages
2. Verify MySQL service is running
3. Check database connection settings
4. Ensure all Maven dependencies are downloaded

