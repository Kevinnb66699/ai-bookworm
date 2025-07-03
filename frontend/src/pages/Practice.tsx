import React, { useState } from 'react';
import axios from 'axios';

const Practice: React.FC = () => {
  const [wordId, setWordId] = useState<number | null>(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCheckWord = async () => {
    try {
      const response = await axios.post('/practice/word', {
        word_id: wordId,
        user_input: userInput,
      });
      const { is_correct, correct_word } = response.data;
      setFeedback(is_correct ? 'Correct!' : `Incorrect. The correct word is: ${correct_word}`);
    } catch (error) {
      console.error('Error checking word:', error);
      setFeedback('Error checking word.');
    }
  };

  return (
    <div>
      <h1>Practice</h1>
      <input
        type="text"
        placeholder="Enter word"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
      />
      <button onClick={handleCheckWord}>Check</button>
      {feedback && <p>{feedback}</p>}
    </div>
  );
};

export default Practice; 