import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useBlockchain } from '../hooks/useBlockchain';
import { FaUpload, FaMusic, FaEthereum, FaLink } from 'react-icons/fa';
import { toast } from 'react-toastify';
import styles from './ArtistDashboard.module.css';

const ArtistDashboard = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Preview state is not currently used but kept for future use
  // const [preview, setPreview] = useState<string>('');
  const [trackName, setTrackName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.01');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  interface MintedTrack {
    id: number;
    name: string;
    description: string;
    price: string;
    uri: string;
    txHash: string;
  }

  const [mintedTrack, setMintedTrack] = useState<MintedTrack | null>(null);
  
  const { isConnected } = useBlockchain();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      // Preview functionality is currently disabled
      // setPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!selectedFile || !trackName || !price) {
      toast.error('Please fill in all fields and select a file');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Here you would typically upload to IPFS or another decentralized storage
      // For now, we'll simulate an upload
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate minting the NFT
      const tokenId = Math.floor(Math.random() * 10000);
      const tokenURI = `ipfs://mock-ipfs-hash-${tokenId}`;
      
      // In a real implementation, you would call your smart contract's mint function here
      // Example:
      // const tx = await contract.mint(account, tokenURI, ethers.utils.parseEther(price));
      // await tx.wait();
      
      clearInterval(uploadInterval);
      setUploadProgress(100);
      
      setMintedTrack({
        id: tokenId,
        name: trackName,
        description,
        price,
        uri: tokenURI,
        // Mock transaction hash
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`
      });
      
      toast.success('Track minted successfully!');
    } catch (error) {
      console.error('Error uploading and minting:', error);
      toast.error('Failed to upload and mint track');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to access the artist dashboard</p>
          <button 
            onClick={() => window.ethereum?.request({ method: 'eth_requestAccounts' })}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Artist Dashboard</h1>
        
        {mintedTrack ? (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center mb-6">
                <FaMusic className="text-4xl text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{mintedTrack.name}</h2>
              <p className="text-gray-400 mb-6">{mintedTrack.description}</p>
              <div className="flex items-center space-x-4 mb-6">
                <span className="flex items-center text-yellow-400">
                  <FaEthereum className="mr-1" /> {mintedTrack.price} ETH
                </span>
                <a 
                  href={`https://sepolia.basescan.org/tx/${mintedTrack.txHash}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-400 hover:text-blue-300"
                >
                  <FaLink className="mr-1" /> View on Explorer
                </a>
              </div>
              <button 
                onClick={() => setMintedTrack(null)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
              >
                Upload Another Track
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Upload New Track</h2>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Track Name</label>
              <input
                type="text"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter track name"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white h-24 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Tell us about your track..."
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Price (ETH)</label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.01"
                />
                <span className="absolute right-3 top-2.5 text-gray-400">ETH</span>
              </div>
            </div>
            
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-purple-500 bg-gray-750' : 'border-gray-600 hover:border-purple-500 hover:bg-gray-750'
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div>
                  <p className="text-purple-400">{selectedFile.name}</p>
                  <p className="text-sm text-gray-400 mt-2">Click to change file</p>
                </div>
              ) : (
                <div>
                  <FaUpload className="mx-auto text-4xl text-purple-500 mb-3" />
                  <p className="text-gray-300">Drag & drop your audio file here, or click to select</p>
                  <p className="text-sm text-gray-500 mt-2">Supports: MP3, WAV, M4A (max 50MB)</p>
                </div>
              )}
            </div>
            
            {isUploading && (
              <div className="mt-6">
                <div className={styles.progressBar}>
                  <div className={`${styles.progressBarFill} ${styles[`progress${Math.round(uploadProgress)}`]}`} />
                </div>
                <p 
                  className="text-right text-sm text-gray-400 mt-1"
                  role="status"
                  aria-live="polite"
                >
                  {uploadProgress}% {uploadProgress < 100 ? 'Uploading...' : 'Finalizing...'}
                </p>
              </div>
            )}
            
            <button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !trackName}
              className={`mt-6 w-full py-3 rounded-full font-bold transition-colors ${
                isUploading || !selectedFile || !trackName
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isUploading ? 'Minting...' : 'Mint & Upload Track'}
            </button>
          </div>
        )}
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Your Tracks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder for user's tracks */}
            <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
              <div className="bg-purple-900 bg-opacity-30 aspect-square rounded mb-4 flex items-center justify-center">
                <FaMusic className="text-4xl text-purple-500" />
              </div>
              <h3 className="font-bold text-lg mb-1">My First Track</h3>
              <p className="text-gray-400 text-sm mb-3">0.01 ETH</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-green-400">Minted</span>
                <button className="text-xs text-gray-400 hover:text-white">View</button>
              </div>
            </div>
            
            {/* Add more tracks here */}
            <div className="bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-purple-500 transition-colors">
              <FaMusic className="text-2xl text-gray-500 mb-2" />
              <p className="text-gray-400">Upload another track</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDashboard;
