# Taskly - Modern Todo Application

Taskly is a modern, feature-rich todo application built with React and Firebase. It offers a clean, intuitive interface for managing tasks with advanced features like task sharing, priority management, and real-time updates.

## 🌟 Features

### Core Features
- **Task Management**: Create, edit, and delete todos with ease
- **Priority Levels**: Set high, medium, or low priority for tasks
- **Categories**: Organize tasks into personal, work, shopping, or other categories
- **Due Dates**: Set deadlines for your tasks
- **Task Descriptions**: Add detailed descriptions to your todos
- **Completion Tracking**: Mark tasks as complete/incomplete

### Advanced Features
- **Task Sharing**: Share tasks with other users
- **Permission Control**: Set view or edit permissions for shared tasks
- **Invitation System**: Send and manage task sharing invitations
- **Real-time Updates**: Changes sync instantly across all users
- **Filtering & Sorting**: 
  - Filter by completion status (All/Pending/Completed)
  - Filter by category
  - Sort by date or priority
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, minimalist interface with smooth animations

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/taskly.git
cd taskly
```

2. Install dependencies:
```bash
cd React
npm install
```

3. Set up Firebase:
   - Create a new Firebase project
   - Enable Google Authentication
   - Create a Firestore database
   - Copy your Firebase configuration to `React/src/firebase.js`

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🔧 Configuration

### Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication in the Authentication section
3. Create a Firestore database in the Firestore Database section
4. Copy your Firebase configuration and replace it in `React/src/firebase.js`

### Security Rules
The application includes comprehensive security rules for Firestore. You can find them in `React/firestore.rules`.

## 💻 Usage

### Creating a Todo
1. Click the "New Task" button
2. Fill in the task details:
   - Title
   - Description (optional)
   - Category
   - Priority
   - Due Date (optional)
3. Click "Add Task"

### Sharing a Todo
1. Click the share icon on any todo
2. Enter the recipient's email
3. Choose permission level (view/edit)
4. Send the invitation

### Managing Shared Todos
- View shared users by clicking "Show Shared Users"
- Modify permissions for shared users
- Revoke access when needed

## 🛠️ Built With
- [React](https://reactjs.org/) - Frontend framework
- [Firebase](https://firebase.google.com/) - Backend and authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/taskly/issues).

## 👤 Author
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments
- Firebase team for the amazing backend service
- React team for the powerful frontend framework
- All contributors who help improve this project 