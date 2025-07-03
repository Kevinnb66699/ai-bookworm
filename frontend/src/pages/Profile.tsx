import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const [username, setUsername] = useState('');
  const { setUsername: setGlobalUsername } = useAuth();

  const handleChangeUsername = async () => {
    const email = localStorage.getItem('email') || '';
    console.log('Retrieved email from localStorage:', email);

    try {
      const response = await axios.post('http://127.0.0.1:5000/auth/update_profile', {
        email: email,
        username: username
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 200) {
        alert('Profile updated successfully');
        setGlobalUsername(username);
        localStorage.setItem('username', username);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div style={{ marginBottom: '10px' }}>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="New Username" />
        <button type="button" onClick={handleChangeUsername}>Change Username</button>
      </div>
    </form>
  );
};

export default Profile; 