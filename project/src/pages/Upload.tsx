import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { toast } from 'react-toastify';
import { FaMusic, FaImage, FaUpload, FaPlus, FaTimes } from 'react-icons/fa';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { uploadToPinata, getIPFSGatewayUrl } from '../utils/pinata';

const MUSIC_NFT_CONTRACT = import.meta.env.VITE_MUSIC_NFT_CONTRACT || '0xbB509d5A144E3E3d240D7CFEdffC568BE35F1348';

const GENRES = [
  'Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'House', 'Techno',
  'Trap', 'Drill', 'Afrobeats', 'Reggae', 'Jazz', 'Soul', 'Funk',
  'Country', 'Latin', 'K-Pop', 'Indie', 'Alternative', 'Metal'
];

const RELEASE_TYPES = ['Single', 'EP', 'Album', 'Track'];

export default function Upload() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    trackTitle: '',
    artistName: '',
    albumName: '',
    releaseType: 'Single',
    genre: 'Hip Hop',
    isExplicit: false,
    samples: [''],
    coverArtFile: null as File | null,
    audioFile: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'coverArt' | 'audio') => {
    const file = e.target.files?.[0];
    if (file) {
      if (fileType === 'coverArt') {
        // Validate image
        if (!file.type.startsWith('image/')) {
          toast.error('Please select a valid image file');
          return;
        }
        setFormData(prev => ({ ...prev, coverArtFile: file }));
      } else {
        // Validate audio
        if (!file.type.startsWith('audio/')) {
          toast.error('Please select a valid audio file');
          return;
        }
        setFormData(prev => ({ ...prev, audioFile: file }));
      }
    }
  };

  const addSample = () => {
    setFormData(prev => ({
      ...prev,
      samples: [...prev.samples, '']
    }));
  };

  const removeSample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      samples: prev.samples.filter((_, i) => i !== index)
    }));
  };

  const updateSample = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      samples: prev.samples.map((s, i) => i === index ? value : s)
    }));
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    // Upload to Pinata IPFS
    try {
      const ipfsHash = await uploadToPinata(file);
      const gatewayUrl = getIPFSGatewayUrl(ipfsHash);
      console.log('✅ Uploaded to IPFS:', gatewayUrl);
      return gatewayUrl;
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      throw error;
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
      
      audio.onerror = () => {
        window.URL.revokeObjectURL(audio.src);
        reject(new Error('Failed to load audio metadata'));
      };
      
      audio.src = URL.createObjectURL(file);
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!formData.trackTitle || !formData.artistName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.coverArtFile || !formData.audioFile) {
      toast.error('Please upload both cover art and audio file');
      return;
    }

    setIsUploading(true);

    try {
      toast.info('Extracting audio duration...');
      
      // Get audio duration
      const durationInSeconds = await getAudioDuration(formData.audioFile);
      const durationFormatted = formatDuration(durationInSeconds);
      
      toast.info('Uploading files to IPFS...');
      
      // Upload files to IPFS
      const coverArtURI = await uploadToIPFS(formData.coverArtFile);
      const audioURI = await uploadToIPFS(formData.audioFile);
      
      // Create metadata JSON (NFT standard format)
      const metadata = {
        name: formData.trackTitle,
        description: `${formData.trackTitle} by ${formData.artistName}`,
        image: coverArtURI,
        animation_url: audioURI, // Standard NFT field for audio/video
        audio_url: audioURI, // Backup field
        artist: formData.artistName,
        genre: formData.genre,
        duration: durationFormatted,
        plays: 0,
        downloadable: true,
        attributes: [
          { trait_type: 'Artist', value: formData.artistName },
          { trait_type: 'Album', value: formData.albumName || 'N/A' },
          { trait_type: 'Release Type', value: formData.releaseType },
          { trait_type: 'Genre', value: formData.genre },
          { trait_type: 'Explicit', value: formData.isExplicit ? 'Yes' : 'No' },
          { trait_type: 'Duration', value: durationFormatted },
        ]
      };
      
      // Upload metadata to IPFS using Pinata
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], 'metadata.json');
      const tokenURI = await uploadToIPFS(metadataFile);
      
      toast.info('Minting NFT...');
      
      console.log('🎵 Minting to contract:', MUSIC_NFT_CONTRACT);
      console.log('📝 Token URI:', tokenURI);
      console.log('🎨 Cover Art URI:', coverArtURI);
      console.log('🎵 Audio URI:', audioURI);
      
      // Filter out empty samples
      const samples = formData.samples.filter(s => s.trim() !== '');
      
      // Mint NFT
      const tx = await writeContractAsync({
        address: MUSIC_NFT_CONTRACT as `0x${string}`,
        abi: [
          {
            name: 'mintMusic',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'trackTitle', type: 'string' },
              { name: 'artistName', type: 'string' },
              { name: 'albumName', type: 'string' },
              { name: 'releaseType', type: 'string' },
              { name: 'genre', type: 'string' },
              { name: 'samples', type: 'string[]' },
              { name: 'coverArtURI', type: 'string' },
              { name: 'audioURI', type: 'string' },
              { name: 'duration', type: 'uint256' },
              { name: 'isExplicit', type: 'bool' },
              { name: 'tokenURI', type: 'string' }
            ],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ],
        functionName: 'mintMusic',
        args: [
          formData.trackTitle,
          formData.artistName,
          formData.albumName || '',
          formData.releaseType,
          formData.genre,
          samples,
          coverArtURI,
          audioURI,
          BigInt(0), // Duration will be extracted from audio file
          formData.isExplicit,
          tokenURI
        ],
      });

      console.log('NFT minted:', tx);
      toast.success('🎉 Music NFT minted successfully!');
      
      // Reset form
      setFormData({
        trackTitle: '',
        artistName: '',
        albumName: '',
        releaseType: 'Single',
        genre: 'Hip Hop',
        isExplicit: false,
        samples: [''],
        coverArtFile: null,
        audioFile: null,
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload music');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <FaMusic className="text-6xl text-gray-600" />
        <h2 className="text-2xl font-bold">Connect Wallet to Upload</h2>
        <p className="text-gray-400 text-center max-w-md">
          Connect your wallet to start uploading your music to BlockMusic
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Your Music</h1>
        <p className="text-gray-400 mt-2">
          Distribute your music as NFTs and earn from every play
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Track Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="trackTitle"
                value={formData.trackTitle}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                placeholder="Enter track title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Artist Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="artistName"
                value={formData.artistName}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                placeholder="Enter artist name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Album Name (Optional)
              </label>
              <input
                type="text"
                name="albumName"
                value={formData.albumName}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                placeholder="Enter album name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Release Type <span className="text-red-500">*</span>
              </label>
              <select
                name="releaseType"
                value={formData.releaseType}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              >
                {RELEASE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Genre <span className="text-red-500">*</span>
              </label>
              <select
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              >
                {GENRES.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isExplicit"
              checked={formData.isExplicit}
              onChange={handleInputChange}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
            <label className="ml-2 text-sm">
              Explicit Content
            </label>
          </div>
        </div>

        {/* Samples Used */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Samples Used (Optional)</h2>
            <button
              type="button"
              onClick={addSample}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
            >
              <FaPlus /> Add Sample
            </button>
          </div>
          
          {formData.samples.map((sample, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={sample}
                onChange={(e) => updateSample(index, e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                placeholder="Sample name or description"
              />
              {formData.samples.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSample(index)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* File Uploads */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Media Files</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cover Art Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Cover Art <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'coverArt')}
                  className="hidden"
                  id="coverArt"
                  required
                />
                <label htmlFor="coverArt" className="cursor-pointer">
                  <FaImage className="mx-auto text-4xl text-gray-500 mb-2" />
                  <p className="text-sm text-gray-400">
                    {formData.coverArtFile ? formData.coverArtFile.name : 'Click to upload cover art'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                </label>
              </div>
            </div>

            {/* Audio Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Audio File <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange(e, 'audio')}
                  className="hidden"
                  id="audioFile"
                  required
                />
                <label htmlFor="audioFile" className="cursor-pointer">
                  <FaMusic className="mx-auto text-4xl text-gray-500 mb-2" />
                  <p className="text-sm text-gray-400">
                    {formData.audioFile ? formData.audioFile.name : 'Click to upload audio'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">MP3, WAV, FLAC up to 100MB</p>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" />
                Uploading...
              </>
            ) : (
              <>
                <FaUpload />
                Upload Music
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4 text-sm">
        <h3 className="font-semibold mb-2">📝 Upload Guidelines:</h3>
        <ul className="space-y-1 text-gray-400">
          <li>• You own all rights to the music you upload</li>
          <li>• Files are stored on IPFS for decentralization</li>
          <li>• NFT represents your ownership - not for sale</li>
          <li>• You earn from every play of your music</li>
          <li>• 100% of streaming revenue goes to you</li>
          <li>• Users stream via subscription - no NFT purchase needed</li>
        </ul>
      </div>
    </div>
  );
}
