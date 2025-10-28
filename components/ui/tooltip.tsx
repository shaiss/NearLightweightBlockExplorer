import React, { createContext, useContext, ReactNode } from 'react';

const TooltipContext = createContext({});

export const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <TooltipContext.Provider value={{}}>{children}</TooltipContext.Provider>;
};

