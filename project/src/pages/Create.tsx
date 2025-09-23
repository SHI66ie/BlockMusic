import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function Create() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useAccount();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      // TODO: Implement NFT minting logic
      console.log('Minting NFT with:', { title, description, price, file });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('NFT created successfully!');
    } catch (error) {
      console.error('Error creating NFT:', error);
      alert('Failed to create NFT');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New NFT</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Upload Music</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Preview" className="mx-auto h-48 w-48 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setPreview('');
                      setFile(null);
                    }}
                    aria-label="Remove selected file"
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex text-sm text-gray-400">
                    <label className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300">
                      <span>Upload a file</span>
                      <input type="file" className="sr-only" onChange={handleFileChange} accept="audio/*,image/*" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-400">MP3, WAV, PNG, JPG up to 10MB</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">Description</label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>

        <div className="w-1/3">
          <label htmlFor="price" className="block text-sm font-medium">Price (ETH)</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              id="price"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="block w-full pr-12 rounded-md bg-gray-800 border-gray-700 text-white"
              placeholder="0.05"
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 sm:text-sm">ETH</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={!isConnected || isLoading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isConnected
                ? 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Creating...' : 'Create NFT'}
          </button>
          {!isConnected && (
            <p className="mt-2 text-sm text-red-400">Please connect your wallet to create an NFT</p>
          )}
        </div>
      </form>
    </div>
  );
}
