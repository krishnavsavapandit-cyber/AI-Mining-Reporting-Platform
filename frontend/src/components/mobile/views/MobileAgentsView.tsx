import React from 'react';
import { MobileWorkflowView } from './MobileWorkflowView';

interface MobileAgentsViewProps {
  onInspectWorkflow?: (id: string) => void;
}

export const MobileAgentsView: React.FC<MobileAgentsViewProps> = (props) => {
  return <MobileWorkflowView {...props} />;
};
