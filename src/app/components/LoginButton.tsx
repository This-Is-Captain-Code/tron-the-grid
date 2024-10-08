// components/LoginButton.tsx
import React, { useState, useEffect } from 'react';
import { Button, Typography, Box } from '@mui/material';

declare global {
  interface Window {
    tronWeb: any;
    tronLink: any;
  }
}

const LoginButton = ({ onLogin }: { onLogin: (address: string | null) => void }) => {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const checkTronLink = async () => {
      if (window.tronWeb && window.tronWeb.ready) {
        const defaultAddress = window.tronWeb.defaultAddress.base58;
        setAddress(defaultAddress);
        onLogin(defaultAddress);
      }
    };

    checkTronLink();

    // Listen for TronLink account change event
    window.addEventListener('message', (e) => {
      if (e.data.message && e.data.message.action === 'setAccount') {
        const newAddress = window.tronWeb.defaultAddress.base58;
        setAddress(newAddress);
        onLogin(newAddress);
      }
    });

    return () => {
      window.removeEventListener('message', () => {});
    };
  }, [onLogin]);

  const handleLogin = async () => {
    if (window.tronLink) {
      try {
        // Request the user to authenticate their Tron wallet
        await window.tronLink.request({ method: 'tron_requestAccounts' });
        
        if (window.tronWeb && window.tronWeb.ready) {
          const defaultAddress = window.tronWeb.defaultAddress.base58;
          setAddress(defaultAddress);
          onLogin(defaultAddress);
        }
      } catch (error) {
        console.error('TronLink authentication failed:', error);
        alert('Authentication failed. Please check your TronLink wallet.');
      }
    } else {
      alert('Please install TronLink wallet!');
    }
  };

  const handleLogout = () => {
    setAddress(null);
    onLogin(null);  // Notify parent component about logout
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {address ? (
        <>
          <Typography variant="h6">Connected: {address}</Typography>
          <Button variant="outlined" onClick={handleLogout}>
            Disconnect
          </Button>
        </>
      ) : (
        <Button variant="contained" onClick={handleLogin}>
          Connect Tron Wallet
        </Button>
      )}
    </Box>
  );
};

export default LoginButton;
