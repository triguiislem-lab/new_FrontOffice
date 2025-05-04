import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Demo component to showcase different loading spinner variants
 */
const LoadingSpinnerDemo = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Loading Spinner Variants</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Circle Variant */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-center">Circle Variant</h2>
          <div className="flex flex-col items-center space-y-8">
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Extra Small</h3>
              <LoadingSpinner variant="circle" size="xs" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Small</h3>
              <LoadingSpinner variant="circle" size="sm" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Medium</h3>
              <LoadingSpinner variant="circle" size="md" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Large</h3>
              <LoadingSpinner variant="circle" size="lg" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Extra Large</h3>
              <LoadingSpinner variant="circle" size="xl" />
            </div>
          </div>
        </div>
        
        {/* Dots Variant */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-center">Dots Variant</h2>
          <div className="flex flex-col items-center space-y-8">
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Extra Small</h3>
              <LoadingSpinner variant="dots" size="xs" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Small</h3>
              <LoadingSpinner variant="dots" size="sm" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Medium</h3>
              <LoadingSpinner variant="dots" size="md" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">With Message</h3>
              <LoadingSpinner variant="dots" size="md" message="Chargement..." />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Custom Color</h3>
              <LoadingSpinner variant="dots" size="md" color="#3B82F6" />
            </div>
          </div>
        </div>
        
        {/* Pulse Variant */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-center">Pulse Variant</h2>
          <div className="flex flex-col items-center space-y-8">
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Extra Small</h3>
              <LoadingSpinner variant="pulse" size="xs" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Small</h3>
              <LoadingSpinner variant="pulse" size="sm" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Medium</h3>
              <LoadingSpinner variant="pulse" size="md" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Large</h3>
              <LoadingSpinner variant="pulse" size="lg" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">Custom Color</h3>
              <LoadingSpinner variant="pulse" size="md" color="#10B981" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay Examples */}
      <h2 className="text-2xl font-bold mt-12 mb-6 text-center">Overlay Examples</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md relative h-64">
          <h3 className="text-xl font-semibold mb-4">Content with Overlay</h3>
          <p className="mb-2">This content is behind an overlay loading spinner.</p>
          <LoadingSpinner variant="circle" size="lg" overlay message="Chargement du contenu..." />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md h-64">
          <h3 className="text-xl font-semibold mb-4">Fullscreen Example (Click Button)</h3>
          <p className="mb-4">Click the button below to see a fullscreen loading spinner for 3 seconds.</p>
          <button 
            className="px-4 py-2 bg-[#A67B5B] text-white rounded hover:bg-[#8B5A2B] transition-colors"
            onClick={() => {
              const fullscreenSpinner = document.createElement('div');
              fullscreenSpinner.id = 'fullscreen-spinner';
              document.body.appendChild(fullscreenSpinner);
              
              // Render the fullscreen spinner
              const root = ReactDOM.createRoot(fullscreenSpinner);
              root.render(<LoadingSpinner fullScreen variant="circle" size="xl" message="Chargement en plein écran..." />);
              
              // Remove after 3 seconds
              setTimeout(() => {
                root.unmount();
                document.body.removeChild(fullscreenSpinner);
              }, 3000);
            }}
          >
            Show Fullscreen Spinner
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinnerDemo;
