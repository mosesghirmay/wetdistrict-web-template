import React, { useContext } from 'react';
import { useMyContext } from './StateHolder';

// Create the context to hold shared functions
const MyContextFunctions = React.createContext();

// ContextFunctions component to provide shared functions
const ContextFunctions = (props) => {
  // Get state functions from another context
  const { setMobileSearchFilterOpen } = useMyContext();

  // Function to toggle the mobile search filter modal
  const onOpenMobileSearchFilterModal = (boolean) => {
    setMobileSearchFilterOpen(boolean);
  };

  return (
    <MyContextFunctions.Provider value={{ onOpenMobileSearchFilterModal }}>
      {props.children}
    </MyContextFunctions.Provider>
  );
};

// Custom hook to use the shared context functions
export const useMyContextFunctions = () => useContext(MyContextFunctions);

export default ContextFunctions;
