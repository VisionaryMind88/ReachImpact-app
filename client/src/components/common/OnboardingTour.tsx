import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  image?: string;
}

interface OnboardingTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  steps?: OnboardingStep[];
}

const defaultSteps: OnboardingStep[] = [
  {
    title: "Welcome to ReachImpact",
    description: "Let's take a quick tour to get you familiar with our platform's features and capabilities. This will just take a minute!",
  },
  {
    title: "Update Your Profile",
    description: "Start by filling out your company profile. The more information you provide, the better our AI can represent your business when making calls.",
  },
  {
    title: "Import Contacts",
    description: "Upload your contacts or add them manually. These are the people our AI will reach out to on your behalf.",
  },
  {
    title: "Create a Campaign",
    description: "Campaigns organize your outreach efforts. Set up a campaign with specific goals, scripts, and target contacts.",
  },
  {
    title: "Monitor Results",
    description: "Track your campaign performance, call history, and appointments directly from your dashboard.",
  },
  {
    title: "You're All Set!",
    description: "You're ready to start using ReachImpact! If you need any help along the way, click the Help button in the navigation.",
  }
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  open,
  onOpenChange,
  onComplete,
  steps = defaultSteps
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!open) {
      // Reset to first step when dialog closes
      setCurrentStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    if (onComplete) {
      onComplete();
    }
    
    toast({
      title: "Welcome to ReachImpact!",
      description: "You can always revisit this tour from the Help section.",
    });
    
    // Save to local storage that user has completed the tour
    localStorage.setItem('onboardingComplete', 'true');
  };

  const handleSkip = () => {
    onOpenChange(false);
    
    toast({
      title: "Tour skipped",
      description: "You can always access the tour later from the Help section.",
    });
    
    // Mark as skipped but not completed
    localStorage.setItem('onboardingSkipped', 'true');
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="icon" onClick={handleSkip}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>
            {step.description}
          </DialogDescription>
        </DialogHeader>
        
        {step.image && (
          <div className="flex justify-center py-6">
            <img 
              src={step.image} 
              alt={step.title} 
              className="rounded-lg max-h-48 object-contain"
            />
          </div>
        )}
        
        <div className="py-4">
          <div className="flex items-center justify-center space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentStep ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip tour
            </Button>
            <Button onClick={handleNext}>
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;