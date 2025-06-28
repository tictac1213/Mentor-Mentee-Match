
# MentorMatch - Mentorship Platform

A full-stack web application to facilitate mentorship by connecting mentors and mentees based on shared skills and interests.

## 📂 Repository
🔗 [GitHub Repository](https://github.com/tictac1213/Mentor-Mentee-Match)


## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript  
- **Backend**: Node.js, Express.js  
- **Database**: MySQL  
- **Authentication**: JSON Web Tokens (JWT)  
- **Environment Management**: dotenv  

## 📦 Features

- User authentication (Login/Signup)
- Mentor and Mentee profile creation
- Option to connect with suitable mentors/mentees
- Responsive and clean user interface
- Role-based redirection (mentor/mentee dashboards)

## ✅ Prerequisites

- [Node.js](https://nodejs.org/) (v16 or above)  
- [MySQL](https://www.mysql.com/) (v8 or above)  
- [Git](https://git-scm.com/)

## 🧑‍💻 Installation Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tictac1213/Mentor-Mentee-Match.git
   cd Mentor-Mentee-Match


2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   Create a `.env` file in the root directory and add the following:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=mentorship
   JWT_SECRET=your_secret_key
   ```

4. **Set up the database**:

   * Create a MySQL database named `mentorship` (or as defined in `.env`)
   * Run any provided SQL schema or seed files if present (e.g., in a `db/` folder)

5. **Start the development server**:

   ```bash
   npm start
   ```

   Visit `http://localhost:3000/` in your browser.

## 📁 Project Structure

```
Mentor-Mentee-Match/
├── config/              # DB connection
├── public/              # Static frontend files
├── routes/              # Express route handlers
├── middleware/          # JWT and other middleware
├── .env                 # Environment variables
├── server.js            # Entry point
├── package.json         # Node dependencies
└── README.md            # Project documentation
```


## 🤝 Contribution

Feel free to fork this repository and submit pull requests.
For major changes, please open an issue first to discuss what you would like to change.

---

📧 For queries, contact: \[[akshat.jain.1306@gmail.com](mailto:akshat.jain.1306@gmail.com)]


