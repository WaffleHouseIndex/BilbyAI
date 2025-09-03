import { useState, useEffect, useRef, useCallback } from 'react';
import { Device, Call } from '@twilio/voice-sdk';

interface TwilioDeviceState {
  device: Device | null;
  isConnected: boolean;
  isConnecting: boolean;
  currentCall: Call | null;
  error: string | null;
  isRegistered: boolean;
}

interface TwilioDeviceHook extends TwilioDeviceState {
  initializeDevice: (identity: string) => Promise<void>;
  makeCall: (number: string) => Promise<void>;
  hangUp: () => void;
  mute: (muted: boolean) => void;
  isMuted: boolean;
}

export function useTwilioDevice(): TwilioDeviceHook {
  const [state, setState] = useState<TwilioDeviceState>({
    device: null,
    isConnected: false,
    isConnecting: false,
    currentCall: null,
    error: null,
    isRegistered: false
  });
  
  const [isMuted, setIsMuted] = useState(false);
  const deviceRef = useRef<Device | null>(null);

  const updateState = useCallback((updates: Partial<TwilioDeviceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const initializeDevice = useCallback(async (identity: string) => {
    try {
      updateState({ isConnecting: true, error: null });

      // Get access token from our API
      const response = await fetch('/api/twilio/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identity })
      });

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const { token } = await response.json();

      // Initialize Twilio Device
      const device = new Device(token, {
        logLevel: 1, // Set to 2 for more verbose logging
        codecPreferences: [Device.AudioCodec.Opus, Device.AudioCodec.PCMU],
      });

      // Set up event listeners
      device.on('registered', () => {
        console.log('Twilio Device registered');
        updateState({ isRegistered: true, isConnecting: false });
      });

      device.on('error', (error) => {
        console.error('Twilio Device error:', error);
        updateState({ error: error.message, isConnecting: false });
      });

      device.on('incoming', (call) => {
        console.log('Incoming call from:', call.parameters.From);
        updateState({ currentCall: call });
        
        // Auto-accept for demo purposes
        // In production, this would show a UI for accepting/rejecting
        call.accept();
      });

      device.on('connect', (call) => {
        console.log('Call connected');
        updateState({ currentCall: call, isConnected: true });
      });

      device.on('disconnect', (call) => {
        console.log('Call disconnected');
        updateState({ currentCall: null, isConnected: false });
        setIsMuted(false);
      });

      // Register the device
      await device.register();
      deviceRef.current = device;
      updateState({ device, isConnecting: false });

    } catch (error) {
      console.error('Error initializing Twilio device:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to initialize device',
        isConnecting: false 
      });
    }
  }, [updateState]);

  const makeCall = useCallback(async (number: string) => {
    if (!deviceRef.current) {
      updateState({ error: 'Device not initialized' });
      return;
    }

    try {
      updateState({ isConnecting: true, error: null });
      
      // Make the call
      const call = await deviceRef.current.connect({
        params: { To: number }
      });

      updateState({ currentCall: call, isConnecting: false });
    } catch (error) {
      console.error('Error making call:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to make call',
        isConnecting: false 
      });
    }
  }, [updateState]);

  const hangUp = useCallback(() => {
    if (state.currentCall) {
      state.currentCall.disconnect();
    }
  }, [state.currentCall]);

  const mute = useCallback((muted: boolean) => {
    if (state.currentCall) {
      state.currentCall.mute(muted);
      setIsMuted(muted);
    }
  }, [state.currentCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
      }
    };
  }, []);

  return {
    ...state,
    isMuted,
    initializeDevice,
    makeCall,
    hangUp,
    mute
  };
}