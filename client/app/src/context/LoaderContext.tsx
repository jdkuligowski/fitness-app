import React, { createContext, useState, useContext } from 'react';

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [isBouncerLoading, setIsBouncerLoading] = useState(false); // Global loading state

  return (
    <LoaderContext.Provider value={{ isBouncerLoading, setIsBouncerLoading }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);
