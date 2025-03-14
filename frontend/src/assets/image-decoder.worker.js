/**
 * Service Worker for image decoding
 * This worker handles the CPU-intensive task of parsing and decoding image data
 */

// Handle messages from the main thread
self.addEventListener('message', async (event) => {
  const { id, action, data } = event.data;
  
  try {
    let result;
    
    switch (action) {
      case 'decodePythonByteString':
        result = parsePythonByteString(data);
        break;
        
      case 'createBlob':
        result = await createBlob(data);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Send the result back to the main thread
    self.postMessage({
      id,
      success: true,
      result
    });
  } catch (error) {
    // Send error back to the main thread
    self.postMessage({
      id,
      success: false,
      error: error.message
    });
  }
});

/**
 * Parses a Python-style byte string into an array of byte values
 * @param {string} pythonByteString - The Python byte string to parse
 * @returns {Uint8Array} The parsed binary data
 */
function parsePythonByteString(pythonByteString) {
  // Remove the b' prefix and ' suffix
  const content = pythonByteString.slice(2, -1);
  
  const bytes = [];
  let i = 0;
  
  while (i < content.length) {
    if (content.substr(i, 2) === '\\x') {
      // Hex escape sequence (\xFF)
      const hex = content.substr(i + 2, 2);
      bytes.push(parseInt(hex, 16));
      i += 4;
    } else if (content.substr(i, 2) === '\\\\') {
      // Escaped backslash (\\)
      bytes.push(92); // ASCII for backslash
      i += 2;
    } else if (content.substr(i, 2) === "\\'") {
      // Escaped single quote (')
      bytes.push(39); // ASCII for single quote
      i += 2;
    } else if (content.substr(i, 2) === '\\n') {
      // Newline
      bytes.push(10); // ASCII for newline
      i += 2;
    } else if (content.substr(i, 2) === '\\r') {
      // Carriage return
      bytes.push(13); // ASCII for carriage return
      i += 2;
    } else if (content.substr(i, 2) === '\\t') {
      // Tab
      bytes.push(9); // ASCII for tab
      i += 2;
    } else if (content[i] === '\\') {
      // Other escape sequence
      bytes.push(content.charCodeAt(i + 1));
      i += 2;
    } else {
      // Regular character
      bytes.push(content.charCodeAt(i));
      i += 1;
    }
  }
  
  return new Uint8Array(bytes);
}

/**
 * Creates a Blob from various data formats
 * @param {Object} options - Options for creating the blob
 * @param {string|Uint8Array} options.data - The data to convert to a Blob
 * @param {string} options.type - The data type (pythonByteString, base64, or raw)
 * @returns {ArrayBuffer} The blob data as ArrayBuffer (will be converted to Blob in the main thread)
 */
async function createBlob(options) {
  const { data, type } = options;
  let binaryData;
  
  if (type === 'pythonByteString') {
    binaryData = parsePythonByteString(data);
  } else if (type === 'base64') {
    // Convert base64 to binary
    const binaryString = atob(data);
    binaryData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      binaryData[i] = binaryString.charCodeAt(i);
    }
  } else if (type === 'raw') {
    // Assume data is already a string that needs to be encoded
    binaryData = new TextEncoder().encode(data);
  } else {
    throw new Error(`Unsupported data type: ${type}`);
  }
  
  // Return the binary data as an ArrayBuffer
  // We can't return a Blob directly because it's not cloneable
  return binaryData.buffer;
}
