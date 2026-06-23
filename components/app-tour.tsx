'use client'

import {
  Tour,
  TourPortal,
  TourSpotlight,
  TourSpotlightRing,
  TourStep,
  TourArrow,
  TourHeader,
  TourTitle,
  TourDescription,
  TourFooter,
  TourPrev,
  TourNext,
  TourSkip,
  TourStepCounter,
} from '@/components/ui/tour'

type AppTourProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STEPS = [
  {
    target: '#nav-dashboard',
    title: 'Dashboard',
    description: 'Get an overview of your sources, tags, pending digests and generated notes at a glance.',
  },
  {
    target: '#nav-sources',
    title: 'Sources',
    description: 'Add RSS feeds, social accounts, videos or files you want the pipeline to monitor.',
  },
  {
    target: '#nav-tags',
    title: 'Tags',
    description: 'Define the interests the LLM uses to categorize incoming articles.',
  },
  {
    target: '#nav-selection',
    title: "Today's selection",
    description: 'Review the subjects the pipeline grouped for you and pick which ones become a note.',
  },
  {
    target: '#nav-notes',
    title: 'Notes',
    description: 'Browse the Markdown notes generated from your selections.',
  },
  {
    target: '#nav-logs',
    title: 'API logs',
    description: 'Inspect every request made to the API, from the web app or your API keys.',
  },
  {
    target: '#nav-config',
    title: 'Settings',
    description: 'Configure the n8n pipeline, manage API keys, and export or delete your data.',
  },
]

export function AppTour({ open, onOpenChange }: AppTourProps) {
  return (
    <Tour open={open} onOpenChange={onOpenChange}>
      <TourPortal>
        <TourSpotlight />
        <TourSpotlightRing />
        {STEPS.map((step) => (
          <TourStep key={step.target} target={step.target} side="bottom">
            <TourArrow />
            <TourHeader>
              <TourTitle>{step.title}</TourTitle>
              <TourDescription>{step.description}</TourDescription>
            </TourHeader>
            <TourFooter>
              <TourStepCounter className="mr-auto" />
              <TourSkip />
              <TourPrev />
              <TourNext />
            </TourFooter>
          </TourStep>
        ))}
      </TourPortal>
    </Tour>
  )
}