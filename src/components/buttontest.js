import React, { useState } from 'react';
import PopupButton from './components/PopupButton';


const PopupButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Button to toggle the pop-up */}
      <button onClick={() => setIsOpen(!isOpen)}>Toggle Pop-up</button>

      {/* Pop-up content */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '0',
            background: 'white',
            padding: '10px',
            border: '1px solid black',
            borderRadius: '5px',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <p>This is a pop-up!</p>
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default PopupButton;
