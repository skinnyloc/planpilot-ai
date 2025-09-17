// Mock functions that return placeholders instead of base44 functionality
export const exportBusinessPlan = async ({ businessIdea, content }) => {
  // For now, return mock response - can be replaced with actual PDF generation later
  return {
    data: new Blob([content], { type: 'text/plain' }),
    headers: {
      'x-filename': `${businessIdea.business_name}_business_plan.txt`
    }
  };
};

export const exportGrantProposal = async ({ proposal, content }) => {
  return {
    data: new Blob([content], { type: 'text/plain' }),
    headers: {
      'x-filename': 'grant_proposal.txt'
    }
  };
};

export const exportCreditRoadmap = async ({ roadmap, content }) => {
  return {
    data: new Blob([content], { type: 'text/plain' }),
    headers: {
      'x-filename': 'credit_roadmap.txt'
    }
  };
};

export const refreshMonthlyGrants = async () => {
  // Mock function - can be replaced with actual grant fetching logic later
  return { success: true, grants: [] };
};

export const generateAndSaveProposal = async (data) => {
  // Mock function - can be replaced with actual proposal generation later
  return { id: Date.now().toString(), ...data };
};

