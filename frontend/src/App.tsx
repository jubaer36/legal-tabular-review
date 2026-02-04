import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { DocumentReview } from './pages/DocumentReview'; // Will create this next
import './App.css';

// Placeholder for DocumentReview until created
const PlaceholderReview = () => <div>Document Review Page (Coming Soon)</div>;

function App() {
  return (
    <Router>
      <header>
        <div className="container">
          <h1>Legal Tabular Review</h1>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/documents/:id" element={<DocumentReview />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
