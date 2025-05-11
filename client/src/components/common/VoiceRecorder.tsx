import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  className?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionComplete,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Transcription mutation
  const transcribeMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.text) {
        onTranscriptionComplete(data.text);
        toast({
          title: "Voice recording transcribed",
          description: "Your voice note has been converted to text.",
        });
      } else {
        toast({
          title: "Transcription failed",
          description: "We couldn't transcribe your recording. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Transcription failed",
        description: "There was an error processing your recording. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startRecording = async () => {
    try {
      // Reset state
      setIsRecording(true);
      setRecordingDuration(0);
      chunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create a new MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Stop all audio tracks
        stream.getAudioTracks().forEach(track => track.stop());
        
        // Convert to text
        transcribeMutation.mutate(blob);
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      
      // Start timer for duration
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      
      toast({
        title: "Could not access microphone",
        description: "Please ensure microphone access is allowed and try again.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {!isRecording ? (
        <Button
          type="button"
          variant="outline"
          onClick={startRecording}
          disabled={transcribeMutation.isPending}
          className="relative overflow-hidden group"
        >
          <Mic className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">
            {transcribeMutation.isPending ? "Transcribing..." : "Record voice note"}
          </span>
          {transcribeMutation.isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </Button>
      ) : (
        <>
          <div className="flex h-9 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground">
            <span className="mr-2">Recording</span>
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-red-500 mr-2"></span>
            <span>{formatDuration(recordingDuration)}</span>
          </div>
          
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={stopRecording}
          >
            <Square className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export default VoiceRecorder;