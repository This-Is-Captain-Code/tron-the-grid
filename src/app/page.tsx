"use client"; 
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, Card, CardContent, CardMedia, MenuItem, Select } from '@mui/material';
import axios from 'axios';
import TronWeb from 'tronweb';
import LoginButton from './components/LoginButton';  // Tron Login Button

const TRON_NILE_URL = 'https://api.nileex.io';

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [source, setSource] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [limit] = useState(10);
  const [tronAddress, setTronAddress] = useState<string | null>(null);

  const sources = ['sketchfab', 'thingiverse', 'smithsonian'];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://35.154.167.42:8080/get_annotations', {
        params: {
          search: searchTerm,
          limit: limit,
          page: page,
          source: source
        }
      });
      setResults(response.data.results);
      setTotalResults(response.data.total);
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Error fetching annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle download model by UID
  const handleDownload = (uid: string) => {
    const downloadUrl = `http://35.154.167.42:8080/download_model/${uid}`;
    window.open(downloadUrl, '_blank');
  };

  // Mint NFT using TronWeb with proper metadata handling from API response
  const mintNFT = async (uid: string) => {
    if (!tronAddress) {
        alert("Please connect your Tron wallet to mint an NFT.");
        return;
    }

    try {
        // Prepare the body for the mint_nft API call
        const mintNftResponse = await axios.post('http://35.154.167.42:8080/mint_nft', {
            uid: uid,
            wallet: tronAddress  // Use the connected wallet address
        });

        // Get metadata from the response
        const metadata = mintNftResponse.data.metadata;

        // Validate the required fields in the metadata
        if (!metadata.download_link || !metadata.image || !metadata.name) {
            alert("Invalid metadata received. Ensure download link, image, and name are present.");
            return;
        }

        // Ensure TronLink (tronWeb) is available
        if (typeof window.tronWeb === 'undefined') {
            alert('TronLink is not available. Please install the TronLink extension and try again.');
            return;
        }

        const tronWeb = window.tronWeb; // Use TronWeb from the TronLink extension

        const contract = await tronWeb.contract().at('TQJZvfamvX7FR4kEVAySivS692CCKUkTgB');

        // Call mint function on the smart contract with valid metadata
        const tx = await contract.mint(
            metadata.download_link,    // The download URL for the 3D model
            metadata.image,            // The image associated with the NFT
            metadata.name              // Model name
        ).send({
            feeLimit: 100_000_000,
            callValue: 0,
            shouldPollResponse: true
        });

        console.log('NFT minted:', tx);
        alert('Successfully minted NFT!');
    } catch (error) {
        console.error('Error minting NFT:', error);
        alert('Minting failed!');
    }
  };


  useEffect(() => {
    handleSearch();
  }, [page, source]);

  return (
    <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', padding: '2rem', color: 'white' }}>
      {/* Tron Wallet Login */}
      <LoginButton onLogin={setTronAddress} />

      <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>Search 3D Models</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <TextField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          label="Search models"
          variant="outlined"
          sx={{ backgroundColor: '#fff', borderRadius: '4px', width: '60%' }}
        />
        <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleSearch}>
          Search
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          displayEmpty
          sx={{ backgroundColor: '#fff', borderRadius: '4px' }}
        >
          <MenuItem value="">All Sources</MenuItem>
          {sources.map((src) => (
            <MenuItem key={src} value={src}>{src}</MenuItem>
          ))}
        </Select>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', mt: 4 }}>
        {results.map((result, index) => (
          <Card key={index} sx={{ backgroundColor: '#1e1e1e', width: '80%', color: 'white', display: 'flex', alignItems: 'center' }}>
            {result.thumbnail && (
              <CardMedia
                component="img"
                image={result.thumbnail}
                alt={result.name}
                sx={{ width: 150, height: 150 }}
              />
            )}
            <CardContent>
              <Typography variant="h6">{result.name}</Typography>
              <Typography variant="body2" sx={{ color: '#aaaaaa' }}>
                {result.description || "No description available."}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                sx={{ mt: 2, mr: 2 }}
                href={result.viewerUrl}
                target="_blank"
              >
                View Model
              </Button>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2, mr: 2 }}
                onClick={() => handleDownload(result.uid)}
              >
                Download Model
              </Button>
              <Button
                variant="contained"
                color="secondary"
                sx={{ mt: 2 }}
                onClick={() => mintNFT(result.uid)}  // Pass uid to mintNFT function
              >
                Mint as NFT
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      {!loading && results.length === 0 && (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
          No models found. Try a different search term.
        </Typography>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button disabled={page === 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))} sx={{ mr: 2 }}>Previous</Button>
        <Typography>Page {page}</Typography>
        <Button disabled={!hasMore} onClick={() => setPage((prev) => prev + 1)} sx={{ ml: 2 }}>Next</Button>
      </Box>
    </Box>
  );
};

export default SearchPage;
