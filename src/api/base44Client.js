// DISABLED: Removing base44 SDK to prevent external redirects
// import { createClient } from '@base44/sdk';

// Create a mock client for local development without base44 dependencies
export const base44 = {
  auth: {
    getCurrentUser: () => null,
    getAccessToken: () => null,
    isAuthenticated: () => false
  },
  entities: {
    BusinessIdea: null,
    BusinessPlan: null,
    GrantProposal: null,
    CreditRoadmap: null,
    Grant: null,
    Proposal: null
  },
  functions: {
    exportBusinessPlan: () => Promise.resolve(null),
    exportGrantProposal: () => Promise.resolve(null),
    exportCreditRoadmap: () => Promise.resolve(null),
    refreshMonthlyGrants: () => Promise.resolve(null),
    generateAndSaveProposal: () => Promise.resolve(null)
  },
  integrations: {
    Core: {
      InvokeLLM: () => Promise.resolve(null),
      SendEmail: () => Promise.resolve(null),
      UploadFile: () => Promise.resolve(null),
      GenerateImage: () => Promise.resolve(null),
      ExtractDataFromUploadedFile: () => Promise.resolve(null),
      CreateFileSignedUrl: () => Promise.resolve(null),
      UploadPrivateFile: () => Promise.resolve(null)
    }
  }
};
