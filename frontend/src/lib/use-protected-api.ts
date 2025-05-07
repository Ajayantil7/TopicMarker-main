import { useState } from 'react';
import { useAuth } from './auth-context';
import { toast } from 'sonner';

/**
 * A custom hook for making protected API calls
 * Handles authentication errors and loading states
 */
export function useProtectedApi() {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, refetchUser } = useAuth();

  /**
   * Make a protected API call
   * @param apiCall The API call function to execute
   * @param onSuccess Optional callback for successful API calls
   * @param onError Optional callback for failed API calls
   * @returns The result of the API call
   */
  const callApi = async <T>(
    apiCall: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to perform this action');
      return null;
    }

    setIsLoading(true);
    try {
      const result = await apiCall();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      
      // Handle authentication errors
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized') || error.message.includes('401')) {
          toast.error('Your session has expired. Please log in again.');
          // Attempt to refresh the user data
          refetchUser();
        } else if (error.message.includes('Forbidden') || error.message.includes('403')) {
          toast.error('You do not have permission to perform this action');
        } else {
          // Generic error handling
          toast.error(`Error: ${error.message}`);
        }
        
        if (onError) {
          onError(error);
        }
      } else {
        toast.error('An unknown error occurred');
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    callApi,
    isLoading
  };
}
