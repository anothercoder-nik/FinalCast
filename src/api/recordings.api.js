// API functions for recordings


export const getRecordings = async (participantId) => {
  try {
    const response = await axiosInstance.get(`/api/recordings/${participantId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recordings:', error);
    throw error;
  }
};

export const downloadRecording = async (url, filename) => {
  try {
    // Create a download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading recording:', error);
    throw error;
  }
};
