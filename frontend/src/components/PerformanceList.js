import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';

function PerformanceList() {
  const [reviews, setReviews] = useState([]);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    axios.get('/api/performance')
      .then(res => setReviews(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <DashboardLayout user={user} logout={logout}>
      <div>
        <h2>Performance Reviews</h2>
        <ul>
          {reviews.map(review => (
            <li key={review._id}>{review.reviewer} - Score: {review.score}</li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}

export default PerformanceList;
